import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDisplayName = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        if (active) setDisplayName(null);
        return;
      }

      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", currentSession.user.id)
          .maybeSingle();

        if (active) {
          setDisplayName(data?.display_name ?? currentSession.user.email ?? null);
        }
      } catch (error) {
        console.warn("Failed to load profile display name:", error);
        if (active) setDisplayName(currentSession.user.email ?? null);
      }
    };

    const applySession = (nextSession: Session | null) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      void loadDisplayName(nextSession);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        applySession(initialSession);
      })
      .catch((error) => {
        console.warn("Failed to restore session:", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error };

    // Block suspended / banned users at sign-in
    const userId = data.user?.id;
    if (userId) {
      try {
        const { data: mod } = await supabase
          .from("user_moderation")
          .select("status, suspended_until, last_reason")
          .eq("user_id", userId)
          .maybeSingle();

        if (mod) {
          // Auto-restore expired suspensions on read (status remains until admin restores; here we only enforce active windows)
          const stillSuspended =
            mod.status === "suspended" &&
            (!mod.suspended_until || new Date(mod.suspended_until) > new Date());

          if (mod.status === "banned") {
            await supabase.auth.signOut();
            return {
              error: new Error(
                mod.last_reason
                  ? `Your account has been banned: ${mod.last_reason}`
                  : "Your account has been banned. Contact an administrator."
              ),
            };
          }
          if (stillSuspended) {
            await supabase.auth.signOut();
            const until = mod.suspended_until
              ? ` until ${new Date(mod.suspended_until).toLocaleString()}`
              : "";
            return {
              error: new Error(
                `Your account is suspended${until}.${mod.last_reason ? " Reason: " + mod.last_reason : ""}`
              ),
            };
          }
        }
      } catch (err) {
        console.warn("Moderation check failed:", err);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
