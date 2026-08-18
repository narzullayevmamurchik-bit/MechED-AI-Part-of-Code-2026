import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import PendingApproval from "@/pages/PendingApproval";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { status, loading: statusLoading } = useApprovalStatus();

  if (loading || adminLoading || (user && statusLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("protected_loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[Access] No user → redirect to /auth");
    return <Navigate to="/auth" replace />;
  }

  const effectiveStatus = isAdmin ? "active" : (status ?? "active");
  const allowed = isAdmin || effectiveStatus === "active";
  console.log(`[Access] user=${user.email} status=${status ?? "(none)"} isAdmin=${isAdmin} → allowed=${allowed}`);

  if (!allowed) {
    return <PendingApproval />;
  }

  return (
    <>
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 right-2 z-[9999] text-[10px] font-mono px-2 py-1 rounded-md bg-background/80 border border-border text-muted-foreground pointer-events-none">
          status: <span className={allowed ? "text-emerald-500" : "text-destructive"}>{effectiveStatus}</span>
          {isAdmin && <span className="ml-1 text-primary">[admin]</span>}
        </div>
      )}
      {children}
    </>
  );
};
