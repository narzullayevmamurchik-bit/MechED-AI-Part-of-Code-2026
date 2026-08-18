import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIMentorChat } from "@/components/AIMentorChat";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { RequirePermission } from "@/components/RequirePermission";

// Lazy-loaded pages for faster initial load
const Index = lazy(() => import("./pages/Index.tsx"));
const CourseDetail = lazy(() => import("./pages/CourseDetail.tsx"));
const Resources = lazy(() => import("./pages/Resources.tsx"));
const Experts = lazy(() => import("./pages/Experts.tsx"));
const ExpertProfile = lazy(() => import("./pages/ExpertProfile.tsx"));
const ExpertInbox = lazy(() => import("./pages/ExpertInbox.tsx"));
const MyQuestions = lazy(() => import("./pages/MyQuestions.tsx"));
const ExpertChatPage = lazy(() => import("./pages/ExpertChat.tsx"));
const MyChats = lazy(() => import("./pages/MyChats.tsx"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase.tsx"));
const KnowledgeEntry = lazy(() => import("./pages/KnowledgeEntry.tsx"));
const ResearchHub = lazy(() => import("./pages/ResearchHub.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Courses = lazy(() => import("./pages/Courses.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const MetallurgyMap = lazy(() => import("./pages/MetallurgyMap.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const Assignments = lazy(() => import("./pages/Assignments.tsx"));
const EngineerMode = lazy(() => import("./pages/EngineerMode.tsx"));
const Collaborate = lazy(() => import("./pages/Collaborate.tsx"));
const Achievements = lazy(() => import("./pages/Achievements.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail.tsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.tsx"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio.tsx"));
const Applications = lazy(() => import("./pages/Applications.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Games = lazy(() => import("./pages/Games.tsx"));
const CareerSimulator = lazy(() => import("./pages/games/CareerSimulator.tsx"));
const MetallurgyLab = lazy(() => import("./pages/games/MetallurgyLab.tsx"));
const CncSimulator = lazy(() => import("./pages/games/CncSimulator.tsx"));
const MaterialsGame = lazy(() => import("./pages/games/MaterialsGame.tsx"));
const FactoryTycoon = lazy(() => import("./pages/games/FactoryTycoon.tsx"));
const QuizArena = lazy(() => import("./pages/games/QuizArena.tsx"));
const PuzzlesHub = lazy(() => import("./pages/games/PuzzlesHub.tsx"));
const ResearchQuests = lazy(() => import("./pages/games/ResearchQuests.tsx"));
const DailyChallenge = lazy(() => import("./pages/games/DailyChallenge.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const PageCrashFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="max-w-md text-center space-y-3">
      <h1 className="text-xl font-semibold text-foreground">This page couldn&apos;t load</h1>
      <p className="text-sm text-muted-foreground">The app recovered safely. Refresh to try again.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Reload page
      </button>
    </div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <DashboardErrorBoundary key={location.pathname} fallback={<PageCrashFallback />}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/experts" element={<ProtectedRoute><Experts /></ProtectedRoute>} />
          <Route path="/experts/inbox" element={<ProtectedRoute><ExpertInbox /></ProtectedRoute>} />
          <Route path="/experts/:expertId" element={<ProtectedRoute><ExpertProfile /></ProtectedRoute>} />
          <Route path="/my-questions" element={<ProtectedRoute><MyQuestions /></ProtectedRoute>} />
          <Route path="/my-chats" element={<ProtectedRoute><MyChats /></ProtectedRoute>} />
          <Route path="/experts/chat/:expertId" element={<ProtectedRoute><ExpertChatPage /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
          <Route path="/knowledge/:answerId" element={<ProtectedRoute><KnowledgeEntry /></ProtectedRoute>} />
          <Route path="/research" element={<ProtectedRoute><ResearchHub /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/metallurgy-map" element={<ProtectedRoute><MetallurgyMap /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
          <Route path="/engineer-mode" element={<ProtectedRoute><EngineerMode /></ProtectedRoute>} />
          <Route path="/collaborate" element={<ProtectedRoute><Collaborate /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path="/games/career" element={<ProtectedRoute><CareerSimulator /></ProtectedRoute>} />
          <Route path="/games/lab/metallurgy" element={<ProtectedRoute><MetallurgyLab /></ProtectedRoute>} />
          <Route path="/games/lab/cnc" element={<ProtectedRoute><CncSimulator /></ProtectedRoute>} />
          <Route path="/games/materials" element={<ProtectedRoute><MaterialsGame /></ProtectedRoute>} />
          <Route path="/games/factory" element={<ProtectedRoute><FactoryTycoon /></ProtectedRoute>} />
          <Route path="/games/quiz" element={<ProtectedRoute><QuizArena /></ProtectedRoute>} />
          <Route path="/games/puzzles" element={<ProtectedRoute><PuzzlesHub /></ProtectedRoute>} />
          <Route path="/games/research" element={<ProtectedRoute><ResearchQuests /></ProtectedRoute>} />
          <Route path="/games/daily" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
          <Route path="/careers" element={<ProtectedRoute><Careers /></ProtectedRoute>} />
          <Route path="/careers/:companyId" element={<ProtectedRoute><CompanyDetail /></ProtectedRoute>} />
          <Route path="/portfolio/:userId" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/p/:slug" element={<PublicPortfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </DashboardErrorBoundary>
  );
};

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <AppRoutes />
              <DashboardErrorBoundary fallback={null}>
                <AIMentorChat />
              </DashboardErrorBoundary>
            </HashRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
