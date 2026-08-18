import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { MechEdLogo } from "@/components/MechEdLogo";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message || "";
        if (/email not confirmed/i.test(msg)) {
          setError("Your account is waiting for administrator approval.");
        } else if (/invalid login credentials/i.test(msg)) {
          setError("Incorrect email or password.");
        } else {
          setError(msg);
        }
      } else {
        navigate("/");
      }
    } else {
      if (!name.trim()) {
        setError(t("auth_enter_name"));
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Your account has been created successfully. Your access request is waiting for administrator approval.");
      }
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-3 mb-8 text-center">
          <MechEdLogo size="xl" className="shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">MechED AI</h1>
            <p className="text-xs text-muted-foreground">{t("auth_engineering_hub")}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">Engineering Education for the Future</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground text-center mb-1">
            {isLogin ? t("auth_welcome_back") : t("auth_create_account")}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isLogin ? t("auth_sign_in_subtitle") : t("auth_sign_up_subtitle")}
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth_full_name")}</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth_your_name")}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("email")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth_email_placeholder")}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("password")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth_password_placeholder")}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? t("auth_please_wait") : isLogin ? t("auth_sign_in") : t("auth_sign_up")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {isLogin ? t("auth_no_account") : t("auth_have_account")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
