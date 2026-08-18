import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MechEdLogo } from "@/components/MechEdLogo";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center flex flex-col items-center gap-4">
        <MechEdLogo size="lg" className="opacity-90" />
        <h1 className="mb-2 text-4xl font-bold">{t("notfound_title")}</h1>
        <p className="mb-2 text-xl text-muted-foreground">{t("notfound_message")}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t("notfound_return")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
