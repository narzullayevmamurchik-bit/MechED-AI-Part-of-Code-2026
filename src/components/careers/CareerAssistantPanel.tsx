import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import { getCareerAdvice } from "@/hooks/useCareers";
import ReactMarkdown from "react-markdown";

export const CareerAssistantPanel = () => {
  const [goal, setGoal] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    setResponse("");
    try {
      const content = await getCareerAdvice(goal || undefined);
      setResponse(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">AI Career Assistant</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get personalized career guidance based on your activity, skills, and achievements.
      </p>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Optional: career goal (e.g. Welding engineer at a steel plant)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <Button onClick={ask} disabled={loading}>
          <Send className="w-4 h-4" /> {loading ? "Thinking..." : "Ask"}
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground animate-pulse">Analyzing your activity, scenarios, and achievements...</div>
      )}

      {response && (
        <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-secondary/30 border border-border">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
};
