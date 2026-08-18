import { Sidebar } from "@/components/Sidebar";
import { useMyQuestions } from "@/hooks/useExpertQA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircleQuestion, Clock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const statusBadge = (s: string) => {
  if (s === "answered") return <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" />Answered</Badge>;
  if (s === "closed") return <Badge variant="outline">Closed</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Open</Badge>;
};

const MyQuestions = () => {
  const navigate = useNavigate();
  const { questions, loading } = useMyQuestions();

  const pending = questions.filter((q) => q.status === "open");
  const answered = questions.filter((q) => q.status === "answered");

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/experts")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />Experts
          </Button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5" /> My Questions
          </h1>
          <p className="text-sm text-muted-foreground">Track conversations with your experts.</p>
        </header>

        <div className="p-6 md:p-8 max-w-4xl space-y-8">
          {loading && <p className="text-muted-foreground">Loading…</p>}

          {!loading && questions.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              You haven't asked any questions yet. <button className="text-primary underline" onClick={() => navigate("/experts")}>Browse experts</button> to get started.
            </CardContent></Card>
          )}

          {pending.length > 0 && (
            <Section title={`Pending (${pending.length})`}>
              {pending.map((q) => <QuestionRow key={q.id} q={q} />)}
            </Section>
          )}

          {answered.length > 0 && (
            <Section title={`Answered (${answered.length})`}>
              {answered.map((q) => <QuestionRow key={q.id} q={q} expanded />)}
            </Section>
          )}
        </div>
      </main>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const QuestionRow = ({ q, expanded }: { q: any; expanded?: boolean }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {statusBadge(q.status)}
            <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
            <Badge variant="outline" className="text-[10px]">{q.priority}</Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              {q.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {q.is_public ? "public" : "private"}
            </Badge>
          </div>
          <h3 className="font-semibold text-foreground">{q.title}</h3>
          {q.expert && (
            <p className="text-xs text-muted-foreground mt-0.5">to {q.expert.avatar} <span className="text-foreground">{q.expert.name}</span></p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{new Date(q.created_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{q.body}</p>

      {expanded && q.answers && q.answers.length > 0 && (
        <div className="mt-3 pl-3 border-l-2 border-primary/40 space-y-2">
          {q.answers.map((a: any) => (
            <div key={a.id}>
              <p className="text-xs text-muted-foreground mb-1">Expert answer · {new Date(a.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-foreground whitespace-pre-line">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default MyQuestions;
