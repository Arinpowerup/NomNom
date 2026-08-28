import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createHousehold, createInvite, joinHousehold, listHouseholds, type Household } from "../lib/households";

type HouseholdValue = { household: Household; households: Household[]; selectHousehold: (id: string) => void; createInvite: () => Promise<string> };
const Context = createContext<HouseholdValue | null>(null);
export function useHousehold() { const value = useContext(Context); if (!value) throw new Error("Missing HouseholdProvider"); return value; }
export function useOptionalHousehold() { return useContext(Context); }

export function HouseholdGate({ children }: { children: ReactNode }) {
  const [households, setHouseholds] = useState<Household[] | null>(null);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("currentHousehold") ?? "");
  const refresh = async (preferred?: string) => { const next = await listHouseholds(); setHouseholds(next); const id = preferred ?? selectedId; if (!next.some((item) => item.id === id)) setSelectedId(next[0]?.id ?? ""); };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (selectedId) localStorage.setItem("currentHousehold", selectedId); }, [selectedId]);
  if (!households) return <div className="auth-loading">正在加载家庭…</div>;
  if (!households.length) return <HouseholdOnboarding onDone={refresh} />;
  const household = households.find((item) => item.id === selectedId) ?? households[0];
  const shareInvite = async () => {
    try {
      const code = await createInvite(household.id);
      await navigator.clipboard?.writeText(code);
      alert(`家庭邀请码：${code}\n有效期 7 天，已复制到剪贴板。`);
    } catch (reason) { alert(reason instanceof Error ? reason.message : "邀请码生成失败"); }
  };
  return <Context.Provider value={{ household, households, selectHousehold: setSelectedId, createInvite: () => createInvite(household.id) }}>
    {children}
    <aside className="family-controls" aria-label="家庭空间">
      <select aria-label="当前家庭" value={household.id} onChange={(event) => setSelectedId(event.target.value)}>{households.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {household.role === "owner" && <button onClick={() => void shareInvite()}>邀请成员</button>}
    </aside>
  </Context.Provider>;
}

function HouseholdOnboarding({ onDone }: { onDone: (id?: string) => Promise<void> }) {
  const [mode, setMode] = useState<"create" | "join">("create"); const [value, setValue] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const id = mode === "create" ? await createHousehold(value) : await joinHousehold(value); await onDone(id); } catch (reason) { setError(reason instanceof Error ? reason.message : "操作失败"); } finally { setBusy(false); } };
  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><span className="auth-mark">家</span><h1>{mode === "create" ? "创建家庭" : "加入家庭"}</h1><p>{mode === "create" ? "创建一份全家共同使用的菜单和冰箱。" : "输入家庭管理员分享给你的邀请码。"}</p><label>{mode === "create" ? "家庭名称" : "邀请码"}<input aria-label={mode === "create" ? "家庭名称" : "邀请码"} value={value} onChange={(e) => setValue(e.target.value)} minLength={mode === "create" ? 1 : 6} required /></label>{error && <p className="auth-message">{error}</p>}<button disabled={busy}>{busy ? "请稍候…" : mode === "create" ? "创建家庭" : "加入家庭"}</button><button type="button" className="auth-switch" onClick={() => { setMode(mode === "create" ? "join" : "create"); setValue(""); setError(""); }}>{mode === "create" ? "已有邀请码？加入家庭" : "没有邀请码？创建家庭"}</button></form></main>;
}
