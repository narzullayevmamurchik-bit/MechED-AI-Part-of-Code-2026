import { Sparkles, ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface Evaluation {
  score?: number;
  breakdown?: {
    relevance?: number;
    technical_accuracy?: number;
    depth?: number;
    structure_clarity?: number;
    originality?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  plagiarism_risk?: { level?: "Low" | "Medium" | "High" | "Uncertain"; explanation?: string };
  summary?: string;
}

interface Props {
  feedback: any;
  score: number | null;
}

const riskColor = (level?: string) => {
  if (level === "High") return "text-destructive bg-destructive/15";
  if (level === "Medium") return "text-amber-500 bg-amber-500/15";
  if (level === "Uncertain") return "text-muted-foreground bg-muted";
  return "text-success bg-success/15";
};

const RiskIcon = ({ level }: { level?: string }) => {
  if (level === "High") return <ShieldAlert className="w-3 h-3" />;
  if (level === "Medium" || level === "Uncertain") return <Shield className="w-3 h-3" />;
  return <ShieldCheck className="w-3 h-3" />;
};

export const AIFeedbackBlock = ({ feedback, score }: Props) => {
  // Backwards compat: legacy plain-text feedback
  if (typeof feedback === "string") {
    return (
      <div className="mt-3 border-l-2 border-accent pl-3 text-xs text-muted-foreground">
        <p className="font-semibold text-accent mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Feedback {score !== null && `(${score}/100)`}
        </p>
        <p className="whitespace-pre-wrap">{feedback}</p>
      </div>
    );
  }

  const e = feedback as Evaluation;
  const b = e.breakdown || {};

  return (
    <div className="mt-3 border-l-2 border-accent pl-3 text-xs text-muted-foreground space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-semibold text-accent flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Evaluation
          {e.score != null || score != null
            ? ` — ${e.score ?? score}/100`
            : " — Not available"}
        </p>
        {e.plagiarism_risk?.level && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${riskColor(e.plagiarism_risk.level)}`}
          >
            <RiskIcon level={e.plagiarism_risk.level} /> Plagiarism: {e.plagiarism_risk.level}
          </span>
        )}
      </div>

      {e.summary && <p className="text-foreground/90 italic">{e.summary}</p>}

      {e.breakdown && (
        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            ["Relevance", b.relevance],
            ["Accuracy", b.technical_accuracy],
            ["Depth", b.depth],
            ["Clarity", b.structure_clarity],
            ["Originality", b.originality],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-secondary/40 rounded px-1 py-1.5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-semibold text-foreground">{val ?? "—"}/20</p>
            </div>
          ))}
        </div>
      )}

      {e.strengths?.length ? (
        <div>
          <p className="font-semibold text-success">Strengths</p>
          <ul className="list-disc list-inside space-y-0.5">
            {e.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      ) : null}

      {e.weaknesses?.length ? (
        <div>
          <p className="font-semibold text-amber-500">Weaknesses</p>
          <ul className="list-disc list-inside space-y-0.5">
            {e.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      ) : null}

      {e.suggestions?.length ? (
        <div>
          <p className="font-semibold text-accent">Suggestions</p>
          <ul className="list-disc list-inside space-y-0.5">
            {e.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      ) : null}

      {e.plagiarism_risk?.explanation && (
        <p className="text-[11px] italic">
          <span className="font-semibold">Plagiarism note:</span> {e.plagiarism_risk.explanation}
        </p>
      )}
    </div>
  );
};
