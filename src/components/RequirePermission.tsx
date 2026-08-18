import { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface RequirePermissionProps {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  /** When true, render nothing instead of the access-denied panel. Useful for buttons. */
  silent?: boolean;
}

export const RequirePermission = ({ module, action, children, fallback, silent }: RequirePermissionProps) => {
  const { can, loading } = usePermissions();

  if (loading) return null;
  if (can(module, action)) return <>{children}</>;
  if (silent) return null;
  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to {action} {module.replace("_", " ")}. Contact an administrator if you need access.
        </p>
      </div>
    </div>
  );
};
