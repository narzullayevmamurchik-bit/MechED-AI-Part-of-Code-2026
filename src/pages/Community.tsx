import { Sidebar } from "@/components/Sidebar";
import { CommunityChat } from "@/components/community/CommunityChat";
import { FeedbackForm } from "@/components/community/FeedbackForm";
import { usePresence } from "@/hooks/usePresence";
import { Users } from "lucide-react";

const Community = () => {
  const { activeCount } = usePresence();

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Community</h1>
              <p className="text-sm text-muted-foreground">Connect with fellow learners</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">{activeCount} online</span>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CommunityChat />
          </div>
          <div>
            <FeedbackForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
