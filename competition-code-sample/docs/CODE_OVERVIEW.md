# Code Overview

Each file below is a **verbatim copy** from the live MechED AI project. Paths mirror the original repo layout.

## `src/pages/Index.tsx`
The dashboard entry point. Demonstrates:
- Composition of the recommendation engine, gamification widgets, presence indicator, and course grid.
- `React.lazy` + `Suspense` for the progress chart and recent-activity panel.
- Hybrid data strategy: DB courses merged with a static fallback (`staticCourses`) so the app keeps working if the network stalls.
- `DashboardErrorBoundary` isolates every dashboard block so a single failing widget cannot break the whole screen.

## `src/hooks/useRecommendations.ts`
The heart of the personalization engine. Reads the last 200 rows of `user_activity`, computes weighted tag scores, and returns `recommendedCourses`, `continueLearning`, `recommendedResources`, `recommendedExperts`, plus per-course related-content helpers. Cold-start users get `popular` / `isLead` fallbacks.

## `src/hooks/useActivityTracker.ts`
Thin event emitter used across the app. Deduplicates identical events within 30 s and enriches each event with `ContentTag`s derived from the item's category.

## `src/data/tags.ts`
The unified tag taxonomy. Maps courses, resource categories, and expert categories into a single `ContentTag` union used by the recommender.

## `src/components/RecommendationSection.tsx`
Presentational components (`RecommendationBlock`, `RecommendedCoursesGrid`, `RecommendedResourcesGrid`, `RecommendedExpertsGrid`) that render recommender output on the dashboard.

## `src/hooks/useCourses.ts`
TanStack Query hook fetching courses from Supabase with a static fallback.

## `src/hooks/useProgress.ts`
Lesson-completion tracking. Computes per-course progress percentages from `user_progress` rows.

## `src/hooks/useGamification.ts`
XP, level, streak, and badge orchestration. Calls `SECURITY DEFINER` RPCs (`award_xp`, `unlock_badge`, `record_daily_activity`) — clients never write XP directly.

## `src/components/gamification/XpProgressCard.tsx` and `StreakCard.tsx`
Compact dashboard widgets that render live gamification state.

## `src/hooks/useAuth.tsx`
Supabase auth context. Restores session on mount, subscribes to `onAuthStateChange`, exposes `user`, `session`, and sign-in/out helpers.

## `src/hooks/usePresence.ts`
Supabase Realtime presence channel — powers the "N online" indicator on the dashboard.

## `src/services/aiMentorService.ts`
Client wrapper around the `ai-mentor` Edge Function. Handles context injection, error surfacing (`FunctionsHttpError.context.text()`), and message threading.

## `src/components/AIMentorChat.tsx`
Floating AI Mentor chat UI. Passes route/course context, renders markdown + LaTeX responses via `MentorResponseRenderer` (not included).

## `supabase/functions/ai-mentor/index.ts`
Deno Edge Function. Verifies the Bearer JWT, builds a grounded system prompt (course + lesson metadata + language), and calls Google Gemini 2.5 via the Lovable AI Gateway. Errors are relayed with status + body intact.

---

## Omitted Dependencies (intentionally not copied)

To keep the sample compact and avoid duplicating the entire project, the following referenced modules are **not** included. They exist in the full MechED AI codebase:

- `@/integrations/supabase/client` — auto-generated Supabase client (contains project-specific URL + publishable key).
- `@/integrations/supabase/types` — auto-generated Postgres → TS types.
- `@/i18n/LanguageContext` — i18n provider (EN / UZ / RU).
- `@/components/ui/*` — shadcn/ui primitives.
- `@/components/Sidebar`, `StatsCard`, `CourseCard`, `GlobalSearch`, `DashboardErrorBoundary`, `ProgressChart`, `RecentActivity`, `CommunityOpportunities`, `ai-mentor/MentorResponseRenderer`.
- `@/data/courses`, `resources`, `experts` — static fallback datasets.
- `@/hooks/useAdmin`, `useApprovalStatus`, and other feature hooks not central to this sample.
- `src/index.css` — design tokens, Tailwind directives, Google Fonts import.
- Database migrations, RLS policies, and other Edge Functions (`game-master`, `grade-submission`, `match-journals`, `ocr-extract`, `career-assistant`, `collaborate`, `engineer-mode`, `check-plagiarism`, `ocr-retry`, `self-check-grade`).

These omissions are architectural — the copied files are still **unmodified originals** and accurately show how the production platform is written.

## Implemented vs. Planned

**Implemented** (present in production, represented in this sample):
- Personalized recommendations with weighted activity scoring
- AI Mentor with course-context grounding via prompt injection
- Gamification (XP, levels, streaks, badges, leaderboard)
- Course + lesson + progress tracking
- Realtime presence
- Admin-approval-gated authentication

**Planned / not yet implemented** (mentioned in docs but out of scope for this sample):
- Full vector-embedding RAG for AI Mentor (currently prompt-context grounding only)
- Cross-project federated recommendations
