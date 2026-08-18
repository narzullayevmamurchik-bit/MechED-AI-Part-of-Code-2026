import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Globe, Palette, Bell, Target, ShieldCheck, Save, Upload, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const { user, displayName } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language, setLanguage } = useLanguage();

  const [name, setName] = useState(displayName || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [progressNotifications, setProgressNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(false);
  const [dailyGoal, setDailyGoal] = useState([30]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  // Admin role-management UI moved to /admin → Users tab.

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(t("toast_profile_updated"));
    } catch {
      toast.error(t("toast_profile_error"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("course-materials").getPublicUrl(filePath);
      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("user_id", user.id);
      setAvatarUrl(data.publicUrl);
      toast.success(t("toast_avatar_uploaded"));
    } catch {
      toast.error(t("toast_avatar_error"));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("toast_password_mismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("toast_password_short"));
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t("toast_password_changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error(t("toast_password_error"));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("light", checked);
    toast.success(`${t("toast_switched_to")} ${newTheme === "light" ? t("settings_light") : t("settings_dark")} ${t("toast_mode")}`);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as "en" | "uz" | "ru");
    toast.success(t("toast_language_saved"));
  };

  // Role assignment is now handled in the dedicated Admin → Users tab.

  const initials = (displayName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{t("settings_title")}</h1>
            <p className="text-muted-foreground mt-1">{t("settings_subtitle")}</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-card border border-border grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1 p-1">
              <TabsTrigger value="profile" className="gap-1.5 text-xs"><User className="w-3.5 h-3.5" />{t("settings_profile")}</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs"><Lock className="w-3.5 h-3.5" />{t("settings_security")}</TabsTrigger>
              <TabsTrigger value="language" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />{t("settings_language")}</TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" />{t("settings_theme")}</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" />{t("settings_alerts")}</TabsTrigger>
              <TabsTrigger value="learning" className="gap-1.5 text-xs"><Target className="w-3.5 h-3.5" />{t("settings_learning")}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_profile_info")}</CardTitle>
                  <CardDescription>{t("settings_profile_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium">
                          <Upload className="w-4 h-4" />
                          {t("settings_upload_avatar")}
                        </div>
                      </Label>
                      <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <p className="text-xs text-muted-foreground mt-2">{t("settings_avatar_hint")}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">{t("settings_display_name")}</Label>
                    <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth_your_name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("email")}</Label>
                    <Input value={user?.email || ""} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground">{t("settings_email_hint")}</p>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    <Save className="w-4 h-4" />
                    {savingProfile ? t("settings_saving") : t("settings_save_changes")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_change_password")}</CardTitle>
                  <CardDescription>{t("settings_password_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("settings_current_password")}</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("settings_new_password")}</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("settings_confirm_password")}</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button onClick={handleChangePassword} disabled={savingPassword}>
                    <Lock className="w-4 h-4" />
                    {savingPassword ? t("settings_updating") : t("settings_change_password")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_language_region")}</CardTitle>
                  <CardDescription>{t("settings_language_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("settings_interface_language")}</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="uz">🇺🇿 O'zbek</SelectItem>
                        <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("settings_language_note")}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_appearance")}</CardTitle>
                  <CardDescription>{t("settings_appearance_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t("settings_light_mode")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_light_mode_desc")}</p>
                    </div>
                    <Switch checked={theme === "light"} onCheckedChange={handleThemeChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === "dark" ? "border-primary bg-card" : "border-border bg-card/50"}`} onClick={() => handleThemeChange(false)}>
                      <div className="w-full h-20 rounded bg-background border border-border mb-2" />
                      <p className="text-sm font-medium text-foreground">{t("settings_dark")}</p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === "light" ? "border-primary bg-card" : "border-border bg-card/50"}`} onClick={() => handleThemeChange(true)}>
                      <div className="w-full h-20 rounded bg-muted-foreground/20 border border-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-foreground">{t("settings_light")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_notifications")}</CardTitle>
                  <CardDescription>{t("settings_notifications_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t("settings_email_notifications")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_email_notifications_desc")}</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t("settings_progress_updates")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_progress_updates_desc")}</p>
                    </div>
                    <Switch checked={progressNotifications} onCheckedChange={setProgressNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t("settings_new_course_alerts")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_new_course_alerts_desc")}</p>
                    </div>
                    <Switch checked={reminderNotifications} onCheckedChange={setReminderNotifications} />
                  </div>
                  <Button onClick={() => toast.success(t("toast_notifications_saved"))}>
                    <Save className="w-4 h-4" />
                    {t("settings_save_preferences")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("settings_learning_preferences")}</CardTitle>
                  <CardDescription>{t("settings_learning_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-3 block">{t("settings_daily_goal")}</Label>
                      <div className="flex items-center gap-4">
                        <Slider value={dailyGoal} onValueChange={setDailyGoal} min={5} max={120} step={5} className="flex-1" />
                        <span className="text-sm font-bold text-primary min-w-[4rem] text-right">{dailyGoal[0]} {t("settings_min")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t("settings_daily_goal_desc")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t("settings_daily_reminders")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_daily_reminders_desc")}</p>
                    </div>
                    <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
                  </div>
                  {remindersEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="reminder-time">{t("settings_reminder_time")}</Label>
                      <Input id="reminder-time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-40" />
                    </div>
                  )}
                  <Button onClick={() => toast.success(t("toast_learning_saved"))}>
                    <Save className="w-4 h-4" />
                    {t("settings_save_preferences")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {isAdmin && (
            <Card className="bg-card border-border mt-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-foreground">{t("settings_admin_title")}</CardTitle>
                </div>
                <CardDescription>{t("settings_admin_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Full user management — including role changes, search, and audit history —
                  is available in the Admin Panel.
                </p>
                <Button asChild>
                  <Link to="/admin">
                    <ShieldCheck className="w-4 h-4" />
                    Open User Management
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
