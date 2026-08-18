import { useEffect, useState } from "react";
import { experts as staticExperts, Expert } from "@/data/experts";

const STORAGE_KEY = "admin_experts";
const EVENT = "admin_experts_changed";

export const loadExperts = (): Expert[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...staticExperts];
  } catch {
    return [...staticExperts];
  }
};

export const saveExperts = (e: Expert[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(e));
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const useExperts = () => {
  const [experts, setExperts] = useState<Expert[]>(loadExperts);

  useEffect(() => {
    const refresh = () => setExperts(loadExperts());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) refresh();
    });
    return () => {
      window.removeEventListener(EVENT, refresh);
    };
  }, []);

  return experts;
};
