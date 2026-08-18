import { BookOpen, Settings, Layout, Library, Users, FlaskConical, LogOut, ShieldCheck, Map, MessageCircle, FileText, HardHat, Globe, Trophy, Briefcase, Send, MessageCircleQuestion, Inbox, MessagesSquare, BookMarked, Gamepad2 } from "lucide-react";
import { MechEdLogo } from "@/components/MechEdLogo";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useGamification } from "@/hooks/useGamification";
import { useMyExpertProfile } from "@/hooks/useExpertsDb";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";

const navItems: { icon: typeof Layout; labelKey: TranslationKey; path: string }[] = [
  { icon: Layout, labelKey: "sidebar_dashboard", path: "/" },
  { icon: BookOpen, labelKey: "sidebar_courses", path: "/courses" },
  { icon: FileText, labelKey: "sidebar_assignments" as TranslationKey, path: "/assignments" },
  { icon: Library, labelKey: "sidebar_resources", path: "/resources" },
{ icon: Users, labelKey: "sidebar_experts", path: "/experts" },
  { icon: FlaskConical, labelKey: "sidebar_research", path: "/research" },
  { icon: Map, labelKey: "sidebar_process_map" as TranslationKey, path: "/metallurgy-map" },
  { icon: HardHat, labelKey: "sidebar_engineer_mode" as TranslationKey, path: "/engineer-mode" },
  { icon: Globe, labelKey: "sidebar_collaborate" as TranslationKey, path: "/collaborate" },
  { icon: Gamepad2, labelKey: "sidebar_achievements" as TranslationKey, path: "/games" },
  { icon: Briefcase, labelKey: "sidebar_careers" as TranslationKey, path: "/careers" },
  { icon: Send, labelKey: "sidebar_applications" as TranslationKey, path: "/applications" },
  { icon: MessageCircle, labelKey: "sidebar_community" as TranslationKey, path: "/community" },
  { icon: Settings, labelKey: "sidebar_settings", path: "/settings" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { stats } = useGamification();
  const { expert: myExpertProfile } = useMyExpertProfile();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
        <MechEdLogo size="sm" className="shadow-sm ring-1 ring-white/10" />
        <div>
          <h1 className="font-bold text-sm">MechEd AI</h1>
          <p className="text-xs text-sidebar-foreground/60">{t("auth_engineering_hub")}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">{t("sidebar_menu")}</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {t(item.labelKey)}
            </button>
          );
        })}

        <button
          onClick={() => navigate("/knowledge")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            location.pathname.startsWith("/knowledge")
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <BookMarked className="w-5 h-5" />
          Knowledge Base
        </button>

        {user && (
          <button
            onClick={() => navigate("/my-questions")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/my-questions"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <MessageCircleQuestion className="w-5 h-5" />
            My Questions
          </button>
        )}

        {user && (
          <button
            onClick={() => navigate("/my-chats")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/my-chats" || location.pathname.startsWith("/experts/chat")
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <MessagesSquare className="w-5 h-5" />
            My Chats
          </button>
        )}

        {myExpertProfile && (
          <button
            onClick={() => navigate("/experts/inbox")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/experts/inbox"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Inbox className="w-5 h-5" />
            Expert Inbox
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <ShieldCheck className="w-5 h-5" />
            {t("sidebar_admin")}
          </button>
        )}
      </nav>

      <button
        onClick={() => navigate("/achievements")}
        className="text-left p-4 m-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/70 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-sidebar-foreground/80">{t("sidebar_study_streak")}</p>
          <span className="text-[10px] font-semibold text-sidebar-primary">Lvl {stats?.level ?? 1}</span>
        </div>
        <p className="text-2xl font-bold text-sidebar-primary mt-1">
          {stats?.current_streak ?? 0} {t("sidebar_days")} {(stats?.current_streak ?? 0) >= 3 ? "🔥" : ""}
        </p>
        <p className="text-xs text-sidebar-foreground/50 mt-1">
          {(stats?.total_xp ?? 0).toLocaleString()} XP total
        </p>
      </button>

      {user && (
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
              {(displayName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName || "User"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              title={t("sidebar_sign_out")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
