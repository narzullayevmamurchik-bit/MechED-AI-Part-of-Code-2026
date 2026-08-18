import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyToJob, fetchMyPortfolioShareUrl, type Job } from "@/hooks/useCareers";
import { toast } from "sonner";
import { Sparkles, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  job: Job;
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export const ApplyJobDialog = ({ job, open, onClose, onApplied }: Props) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const url = await fetchMyPortfolioShareUrl();
      setPortfolioUrl(url);
    })();
  }, [open]);

  const usePortfolio = () => {
    if (!portfolioUrl) return;
    setResumeUrl(portfolioUrl);
    toast.success("Resume link filled from your portfolio");
  };

  const submit = async () => {
    setSubmitting(true);
    const app = await applyToJob({
      jobId: job.id,
      companyId: job.company_id,
      coverLetter: coverLetter.trim() || undefined,
      resumeUrl: resumeUrl.trim() || undefined,
    });
    setSubmitting(false);
    if (!app) {
      toast.error("Could not submit application. You may have already applied.");
      return;
    }
    toast.success("Application submitted");
    setCoverLetter("");
    setResumeUrl("");
    onApplied();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>Your application will be tracked here so you can follow the status timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cover">Cover note <span className="text-muted-foreground">(optional)</span></Label>
            <textarea
              id="cover"
              className="w-full min-h-[120px] px-3 py-2 rounded-md bg-background border border-border text-sm"
              placeholder="Why are you a great fit for this role?"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="resume">Resume / portfolio link <span className="text-muted-foreground">(optional)</span></Label>
              {portfolioUrl ? (
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={usePortfolio}>
                  <Sparkles className="w-3 h-3 mr-1" /> Use my portfolio
                </Button>
              ) : (
                <Link to="/portfolio/me" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                  Set up portfolio <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <Input
              id="resume"
              placeholder="https://..."
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
            />
            {portfolioUrl && resumeUrl === portfolioUrl && (
              <p className="text-xs text-muted-foreground">Linked to your public portfolio page.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
