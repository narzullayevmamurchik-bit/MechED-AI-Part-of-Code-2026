import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCollaboration } from "@/hooks/useCollaboration";
import { ProjectCard } from "@/components/collaborate/ProjectCard";
import { ProposeProjectForm } from "@/components/collaborate/ProposeProjectForm";
import { ProjectWorkspace } from "@/components/collaborate/ProjectWorkspace";
import { AdminProjectApproval } from "@/components/collaborate/AdminProjectApproval";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Globe, Plus, ShieldCheck, FolderOpen, Loader2 } from "lucide-react";

const Collaborate = () => {
  const { approvedProjects, myProjects, isAdmin, loading, refresh } = useCollaboration();
  const [openId, setOpenId] = useState<string | null>(null);
  const [proposing, setProposing] = useState(false);

  if (openId) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 md:p-8 max-w-6xl">
          <ProjectWorkspace projectId={openId} onBack={() => { setOpenId(null); void refresh(); }} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Global Collaboration</h1>
                <p className="text-sm text-muted-foreground">Build and join cross-border engineering projects</p>
              </div>
            </div>
            <Button onClick={() => setProposing(true)}>
              <Plus className="w-4 h-4 mr-1" /> Propose project
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-6xl space-y-6">
          {proposing && (
            <ProposeProjectForm
              onCreated={() => { setProposing(false); void refresh(); }}
              onCancel={() => setProposing(false)}
            />
          )}

          <Tabs defaultValue="discover">
            <TabsList>
              <TabsTrigger value="discover"><Globe className="w-4 h-4 mr-1" /> Discover</TabsTrigger>
              <TabsTrigger value="mine"><FolderOpen className="w-4 h-4 mr-1" /> My projects</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="review"><ShieldCheck className="w-4 h-4 mr-1" /> Admin review</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="discover">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-6" />
              ) : approvedProjects.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                  <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No active projects yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to propose one — admins will approve it shortly.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} onOpen={setOpenId} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mine">
              {myProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">You haven't proposed any projects yet.</p>
              ) : (
                <div className="space-y-3">
                  {myProjects.map((p) => (
                    <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase font-semibold text-primary">{p.topic}</p>
                        <p className="font-semibold text-foreground truncate">{p.title}</p>
                        {p.status === "rejected" && p.rejection_reason && (
                          <p className="text-xs text-destructive mt-1">Rejected: {p.rejection_reason}</p>
                        )}
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-full uppercase font-semibold ${
                        p.status === "approved" ? "bg-green-500/20 text-green-500"
                        : p.status === "pending" ? "bg-yellow-500/20 text-yellow-500"
                        : p.status === "rejected" ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                      {p.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => setOpenId(p.id)}>Open</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="review">
                <AdminProjectApproval />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Collaborate;
