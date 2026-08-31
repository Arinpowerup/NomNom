import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { AuthForm } from "./AuthForm";

type AuthValue = { user: User; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("Missing AuthProvider"); return value; }
export function useOptionalAuth() { return useContext(AuthContext); }

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
  return <AuthContext.Provider value={{ user: session.user, signOut }}>{children}</AuthContext.Provider>;
}

function Setup() { return <main className="auth-shell"><section className="auth-card" role="alert"><span className="auth-mark">N</span><h1>连接 Supabase</h1><p>项目尚未配置云端连接。请在 Vercel 环境变量中添加以下两项：</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><p className="auth-hint">不要在前端使用 service_role 密钥。</p></section></main>; }
