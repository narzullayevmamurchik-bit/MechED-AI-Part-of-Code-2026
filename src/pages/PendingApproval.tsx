import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Clock, ShieldAlert, Ban, RefreshCw, LogOut } from "lucide-react";
import { MechEdLogo } from "@/components/MechEdLogo";

export const PendingApproval = () => {
  const { signOut, displayName } = useAuth();
  const { status, reason, refresh, loading } = useApprovalStatus();

  const config = (() => {
    switch (status) {
      case "suspended":
        return {
          icon: ShieldAlert,
          tone: "text-amber-500",
          title: "Account suspended",
          message: "Your access has been temporarily suspended by an administrator.",
        };
      case "banned":
        return {
          icon: Ban,
          tone: "text-destructive",
          title: "Access blocked",
          message: "Your account has been blocked. Please contact an administrator if you believe this is a mistake.",
        };
      default:
        return {
          icon: Clock,
          tone: "text-primary",
          title: "Waiting for admin approval",
          message: "Thanks for signing up. An administrator will review your account shortly. You'll get full access as soon as you're approved.",
        };
    }
  })();

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <MechEdLogo size="lg" className="mx-auto" />
        <div className={`mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center ${config.tone}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.message}</p>
          {displayName && (
            <p className="text-xs text-muted-foreground">Signed in as <span className="font-medium text-foreground">{displayName}</span></p>
          )}
          {reason && (
            <p className="text-xs text-muted-foreground italic mt-2">Reason: {reason}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Check again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
