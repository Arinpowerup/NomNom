import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Language } from "../types";
import { loadData, saveData } from "../lib/db";
import { loadCloudData, saveCloudData, subscribeCloudData } from "../lib/cloudData";
import { migrateLocalData } from "../lib/migration";

type Value = {
  data: AppData | null;
  setData: (next: AppData) => void;
  language: Language;
  setLanguage: (v: Language) => void;
  currentRoleId: string;
  setCurrentRoleId: (v: string) => void;
};
const Context = createContext<Value | null>(null);
export function AppProvider({ children, householdId, userId }: { children: ReactNode; householdId?: string; userId?: string }) {
  const [data, setState] = useState<AppData | null>(null);
  const [language, setLang] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || "zh",
  );
  const [currentRoleId, setRole] = useState(
    () => localStorage.getItem("currentRole") || "role-me",
  );
  useEffect(() => {
    let active = true;
    void loadData().then(async (local) => {
      if (!householdId || !userId) { if (active) setState(local); return; }
      try {
        const cloud = await loadCloudData(householdId);
        if (!active) return;
        if (cloud) { setState(cloud); await saveData(cloud); }
        else { setState(local); await migrateLocalData(householdId, userId, local); }
      } catch { if (active) setState(local); }
    });
    const unsubscribe = householdId ? subscribeCloudData(householdId, () => {
      void loadCloudData(householdId).then((cloud) => { if (active && cloud) { setState(cloud); void saveData(cloud); } });
    }) : undefined;
    return () => { active = false; unsubscribe?.(); };
  }, [householdId, userId]);
  const setData = (next: AppData) => {
    setState(next);
    void saveData(next);
    if (householdId && userId) void saveCloudData(householdId, userId, next);
  };
  const setLanguage = (v: Language) => {
    setLang(v);
    localStorage.setItem("language", v);
  };
  const setCurrentRoleId = (v: string) => {
    setRole(v);
    localStorage.setItem("currentRole", v);
  };
  const value = useMemo(
    () => ({
      data,
      setData,
      language,
      setLanguage,
      currentRoleId,
      setCurrentRoleId,
    }),
    [data, language, currentRoleId],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing AppProvider");
  return value;
}
