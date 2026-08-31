import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type Mode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "register"
      ? await supabase!.auth.signUp({ email: email.trim(), password })
      : await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "register" && !result.data.session) setMessage("注册成功，请打开邮箱完成验证后登录。");
  };

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <div className="auth-brand">
      <span className="auth-mark">
        <img src="/brand/nomnom-mark.png" alt="NomNom logo" />
      </span>
      <p className="eyebrow">NomNom</p>
    </div>
    <h1>{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
    <p>登录后即可与家庭成员共同安排菜单、冰箱和食记。</p>
    <label>邮箱<input aria-label="邮箱" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
    <label>密码<input aria-label="密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
    {message && <p className="auth-message" role="status">{message}</p>}
    <button type="submit" disabled={busy}>{busy ? "请稍候…" : mode === "login" ? "登录" : "注册"}</button>
    <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "没有账号？立即注册" : "已有账号？返回登录"}</button>
  </form></main>;
}
