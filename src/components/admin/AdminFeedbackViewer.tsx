import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedbackItem {
  id: string;
  user_id: string;
  category: string;
  message: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  general: "bg-primary/10 text-primary",
  bug: "bg-destructive/10 text-destructive",
  feature: "bg-accent/10 text-accent",
  content: "bg-green-500/10 text-green-500",
  other: "bg-muted text-muted-foreground",
};

export const AdminFeedbackViewer = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setFeedback(data as FeedbackItem[]);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">User Feedback ({feedback.length})</h3>
      </div>

      {feedback.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No feedback yet.</p>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {feedback.map((f) => (
          <div key={f.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${categoryColors[f.category] || ""}`}>
                {f.category}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {new Date(f.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-foreground">{f.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
