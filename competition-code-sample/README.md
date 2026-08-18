# MechED AI — Part of Code (Competition Submission)

This folder is a **representative source-code sample** extracted from the larger, production **MechED AI** platform. It is not a standalone runnable project — it is a curated set of real implementation files intended for competition review.

## What is MechED AI?

MechED AI is an AI-powered engineering education platform (web + Electron desktop) focused on mechanical, materials, and metallurgical engineering. It combines:

- Structured **courses, lessons, and assignments** across 27 engineering fields
- A **personalized recommendation engine** driven by user activity
- An **AI Mentor** (Gemini 2.5 via Lovable AI Gateway) grounded in the student's course context
- **Gamification** (XP, streaks, badges, leaderboards) wired into every learning action
- **Expert mentorship** with real-time 1:1 chat and an auto-published Knowledge Base
- **OCR** for handwritten multilingual assignment submissions
- **Research Hub** with journal matching and predatory-journal detection

## Problem It Addresses

Engineering students in the CIS region lack a unified, discipline-organized platform that combines high-quality curated resources, direct expert mentorship, and adaptive AI tutoring in their local languages (English / Uzbek / Russian). MechED AI closes that gap.

## What This "Part of Code" Demonstrates

The sample focuses on the technically strongest, most representative slices of the real codebase:

| Area | File(s) |
|---|---|
| Dashboard architecture & integration | `src/pages/Index.tsx` |
| Personalized recommendation engine | `src/hooks/useRecommendations.ts`, `src/hooks/useActivityTracker.ts`, `src/data/tags.ts`, `src/components/RecommendationSection.tsx` |
| AI Mentor (frontend + Edge Function) | `src/components/AIMentorChat.tsx`, `src/services/aiMentorService.ts`, `supabase/functions/ai-mentor/index.ts` |
| Course + progress tracking | `src/hooks/useCourses.ts`, `src/hooks/useProgress.ts` |
| Gamification (XP, streak) | `src/hooks/useGamification.ts`, `src/components/gamification/*` |
| Auth & presence | `src/hooks/useAuth.tsx`, `src/hooks/usePresence.ts` |

All files are **byte-for-byte copies** from the live MechED AI project — no synthetic/mock code was invented for this submission.

## High-Level Architecture

```
React 18 + Vite + TypeScript  ── UI, routing, Tailwind design system
        │
        ▼
Hooks / Services layer        ── useRecommendations, useGamification,
                                 useProgress, aiMentorService
        │
        ▼
Supabase (Postgres + Auth +   ── RLS-secured tables, realtime channels,
Storage + Edge Functions)        SECURITY DEFINER RPCs
        │
        ▼
Lovable AI Gateway            ── Gemini 2.5 for AI Mentor, game master,
(Edge Function → LLM)            journal matcher, grading, OCR review
```

## Recommendation Algorithm (Implemented)

1. Every meaningful user action (`course_view`, `lesson_complete`, `resource_open`, `resource_bookmark`, `expert_view`, `search`) is logged into the `user_activity` table together with its **content tags** (see `src/data/tags.ts`).
2. `useRecommendations` fetches the last 200 activity rows and computes **weighted tag scores**:
   - `lesson_complete: 3`, `resource_bookmark: 2.5`, `course_view: 2`, `resource_open: 2`, `expert_view: 1.5`, `search: 1`
3. The user's **top tags** are used to score every course / resource / expert by tag overlap.
4. **Continue-learning** courses (progress > 0 and < 100) are boosted above cold recommendations.
5. Cold-start users fall back to `popular` resources and `isLead` experts.

## AI Mentor (Implemented)

- **Frontend** (`AIMentorChat.tsx`) opens a floating chat, streams messages, and passes the current route / course context.
- **Service** (`aiMentorService.ts`) invokes the `ai-mentor` Supabase Edge Function via the authenticated Supabase client.
- **Edge Function** (`supabase/functions/ai-mentor/index.ts`) verifies the caller's JWT, injects a system prompt grounded in the current course / lesson metadata, and calls **Google Gemini 2.5** through the Lovable AI Gateway. It streams the response back to the client.
- Grounding is **context-injection based** (course title, current lesson, user language). A full vector-RAG index is *not* implemented in the current build.

## Supabase / Backend Role

- Postgres with **RLS on every public table** and `has_role(user_id, role)` `SECURITY DEFINER` checks against a separate `user_roles` table (never on profiles).
- Auth: email + Google OAuth, admin-approval gating via `user_moderation.status`.
- Realtime channels for chat, presence, and typing indicators.
- Storage buckets for expert media and OCR uploads.
- Edge Functions for every server-authoritative action (AI, grading, XP awards, OCR).

## Main Technologies

React 18 · Vite 5 · TypeScript 5 · Tailwind CSS v3 · shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions / Deno) · Google Gemini 2.5 via Lovable AI Gateway · Electron (desktop distribution) · TanStack Query.

## Security Note

This folder is intentionally **sanitized**:

- No `.env`, API keys, service-role keys, tokens, passwords, or user data are included.
- Only a placeholder `.env.example` is provided.
- No binaries, installers, `MechEd.exe`, `electron-release/`, `node_modules/`, `dist/`, or generated artifacts are included.
- Production Supabase project IDs, gateway keys, and OAuth secrets remain exclusively in the private production environment.

## Disclaimer

This repository/folder is a **representative source-code sample** from the larger MechED AI platform. It is not the full application and is not intended to be built or run in isolation. Some referenced modules (e.g. `@/integrations/supabase/client`, UI primitives, and design tokens) live in the main project and are intentionally omitted here — see `docs/CODE_OVERVIEW.md` for the exact list of omitted dependencies.
