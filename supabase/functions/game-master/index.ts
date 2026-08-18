import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const MODEL = 'google/gemini-2.5-flash';

async function requireAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supa.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}

interface Body {
  action: 'generate_quiz' | 'generate_daily' | 'grade_research_answer' | 'career_dilemma' | 'hint';
  topic?: string;
  difficulty?: string;
  count?: number;
  question?: string;
  answer?: string;
  context?: string;
  stage?: string;
}

async function callAI(messages: { role: string; content: string }[], jsonMode = true) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authFail = await requireAuth(req);
  if (authFail) return authFail;
  try {
    const body = (await req.json()) as Body;
    const { action } = body;

    if (action === 'generate_quiz') {
      const topic = body.topic || 'Mechanical Engineering';
      const difficulty = body.difficulty || 'normal';
      const count = Math.min(body.count || 10, 15);
      const content = await callAI([
        {
          role: 'system',
          content:
            'You are an engineering quiz generator. Always respond with JSON: { "questions": [ { "question": "...", "options": ["a","b","c","d"], "correct_idx": 0, "explanation": "..." } ] }. Exactly 4 options each, correct_idx 0-3.',
        },
        {
          role: 'user',
          content: `Generate ${count} ${difficulty} multiple-choice questions about ${topic}.`,
        },
      ]);
      return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_daily') {
      const content = await callAI([
        {
          role: 'system',
          content:
            'Generate ONE engineering daily challenge as JSON: { "prompt": "...", "type": "quiz|design|analysis", "payload": { "question": "...", "options": ["a","b","c","d"], "correct_idx": 0, "explanation": "..." } }.',
        },
        { role: 'user', content: 'Today\'s challenge for engineering students.' },
      ]);
      return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'grade_research_answer') {
      const content = await callAI([
        {
          role: 'system',
          content:
            'Grade a research answer on a 0-100 rubric. Respond as JSON: { "score": number, "feedback": "...", "strengths": ["..."], "improvements": ["..."] }.',
        },
        {
          role: 'user',
          content: `Question: ${body.question}\n\nStudent answer: ${body.answer}\n\nContext: ${body.context || ''}`,
        },
      ]);
      return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'career_dilemma') {
      const content = await callAI([
        {
          role: 'system',
          content:
            'Generate ONE career-stage dilemma as JSON: { "scenario": "...", "choices": [ { "label": "...", "outcome": "...", "score": 0 }, ... ] }. 3 choices, scores -10..+10.',
        },
        { role: 'user', content: `Career stage: ${body.stage}` },
      ]);
      return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'hint') {
      const content = await callAI(
        [
          { role: 'system', content: 'You are a helpful engineering mentor. Give a short hint (max 2 sentences). Respond as JSON: { "hint": "..." }.' },
          { role: 'user', content: body.context || '' },
        ],
      );
      return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('game-master error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
