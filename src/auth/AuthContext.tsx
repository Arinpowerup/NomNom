import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthValue = { user: User; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("Missing AuthProvider"); return value; }

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!isSupabaseConfigured) return <Setup />;
  if (loading) return <div className="auth-loading">正在验证登录状态…</div>;
  if (!session) return <AuthForm />;
  const signOut = async () => { const { error } = await supabase!.auth.signOut(); if (error) throw error; };
  return <AuthContext.Provider value={{ user: session.user, signOut }}>{children}<button className="account-signout" onClick={() => void signOut()} aria-label="退出登录">退出</button></AuthContext.Provider>;
}

function Setup() { return <main className="auth-shell"><section className="auth-card" role="alert"><span className="auth-mark">N</span><h1>连接 Supabase</h1><p>项目尚未配置云端连接。请在 Vercel 环境变量中添加以下两项：</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><p className="auth-hint">不要在前端使用 service_role 密钥。</p></section></main>; }

function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); const result = mode === "register" ? await supabase!.auth.signUp({ email, password }) : await supabase!.auth.signInWithPassword({ email, password }); setBusy(false); if (result.error) return setMessage(result.error.message); if (mode === "register" && !result.data.session) setMessage("注册成功，请打开邮箱完成验证后登录。"); };
  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><span className="auth-mark">N</span><p className="eyebrow">NOMNOM FAMILY</p><h1>{mode === "login" ? "欢迎回来" : "创建账号"}</h1><p>登录后即可与家庭成员共同安排菜单、冰箱和食记。</p><label>邮箱<input aria-label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label><label>密码<input aria-label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>{message && <p className="auth-message">{message}</p>}<button type="submit" disabled={busy}>{busy ? "请稍候…" : mode === "login" ? "登录" : "注册"}</button><button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "没有账号？立即注册" : "已有账号？返回登录"}</button></form></main>;
}
