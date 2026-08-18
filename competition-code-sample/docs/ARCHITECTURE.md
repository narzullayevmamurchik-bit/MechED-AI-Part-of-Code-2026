# Architecture

## Layered Overview

```
┌──────────────────────────────────────────────────────────┐
│  Presentation (React 18 + TS + Tailwind + shadcn/ui)     │
│  - src/pages/*        route-level screens                │
│  - src/components/*   reusable UI + feature widgets      │
└─────────────────────────┬────────────────────────────────┘
                          │ hooks
┌─────────────────────────▼────────────────────────────────┐
│  Domain Hooks / Services (TypeScript)                    │
│  - useAuth, useProgress, useCourses                      │
│  - useRecommendations, useActivityTracker                │
│  - useGamification, usePresence                          │
│  - services/aiMentorService                              │
└─────────────────────────┬────────────────────────────────┘
                          │ supabase-js
┌─────────────────────────▼────────────────────────────────┐
│  Supabase Backend                                        │
│  - Postgres w/ RLS + SECURITY DEFINER RPCs               │
│  - Auth (email + Google OAuth, admin approval gate)      │
│  - Realtime (chat, presence, typing)                     │
│  - Storage (expert-media, ocr-uploads)                   │
│  - Edge Functions (Deno) ─── ai-mentor, game-master,     │
│    grade-submission, match-journals, ocr-extract, …      │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│  Lovable AI Gateway → Google Gemini 2.5                  │
└──────────────────────────────────────────────────────────┘
```

## Data Flow: Personalized Recommendations

1. **Emit** — components call `useActivityTracker` on user actions (view course, complete lesson, open resource, bookmark, view expert, search). Each event carries a set of `ContentTag`s derived from `src/data/tags.ts`.
2. **Persist** — the hook inserts into `public.user_activity` (RLS: user can insert/select only their own rows). In-memory de-duplication prevents spamming identical events within 30 s.
3. **Aggregate** — `useRecommendations` reads the last 200 rows for the current user and computes a weighted `tagScores` map.
4. **Rank** — courses / resources / experts are scored by tag overlap and re-ordered. Courses with in-progress state are prioritized (Continue Learning).
5. **Render** — `RecommendationSection.tsx` renders themed blocks on the dashboard.

## Data Flow: AI Mentor

1. `AIMentorChat.tsx` collects user input plus current-page context (`courseId`, `lessonId`, `language`).
2. `aiMentorService.ts` calls `supabase.functions.invoke('ai-mentor', ...)` — the authenticated JWT is sent automatically.
3. `supabase/functions/ai-mentor/index.ts` verifies the JWT server-side, builds a system prompt (course + lesson metadata, language, safety rules), and calls Gemini 2.5 through the Lovable AI Gateway.
4. Response is streamed / returned to the client, rendered with markdown + LaTeX support.

## Security Model

- **Roles** live in `public.user_roles`, never on profiles.
- Access checks use `public.has_role(auth.uid(), 'admin')` — a `SECURITY DEFINER` function on a stable search path, avoiding recursive RLS.
- Every public table has explicit `GRANT` statements and RLS policies.
- Edge Functions **verify Bearer JWTs** before touching data or calling the AI Gateway.
- Sensitive expert contact fields are hidden behind the `get_expert_contact` RPC.
- XP / badges can only be granted via `SECURITY DEFINER` wrappers (never directly by clients).

## Frontend Design System

Tokenized in `src/index.css` (not included here) and consumed via Tailwind + shadcn variants. Fonts: Inter (UI) + JetBrains Mono (code / metrics). Theme: dark industrial with a neon-orange accent.

## Electron Packaging

The same Vite bundle is packaged as a Windows Electron app. Routing uses `HashRouter` and asset paths are relative (`base: './'`) so the app loads from the `file://` protocol. Electron sources are outside the scope of this sample.
