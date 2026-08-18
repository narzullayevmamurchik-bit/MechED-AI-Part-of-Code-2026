import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

export const FeedbackForm = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      category,
      message: message.trim(),
    });
    if (error) {
      toast.error("Failed to send feedback");
    } else {
      toast.success("Thank you for your feedback!");
      setMessage("");
      setCategory("general");
    }
    setSending(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Send Feedback</h3>
      </div>
      <p className="text-xs text-muted-foreground">Your feedback is private and helps us improve the platform.</p>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">General</SelectItem>
          <SelectItem value="bug">Bug Report</SelectItem>
          <SelectItem value="feature">Feature Request</SelectItem>
          <SelectItem value="content">Content Suggestion</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us what you think..."
        rows={4}
      />

      <Button onClick={handleSubmit} disabled={sending || !message.trim()} className="gap-1.5">
        <Send className="w-4 h-4" />
        {sending ? "Sending..." : "Submit Feedback"}
      </Button>
    </div>
  );
};
