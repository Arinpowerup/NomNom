import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { formatPhone, type CountryCode } from "../lib/phone";

type Method = "email" | "phone";
type Mode = "login" | "register";

function messageOf(reason: unknown) {
  if (reason && typeof reason === "object" && "message" in reason && typeof reason.message === "string") return reason.message;
  return "认证服务暂时不可用，请稍后重试。";
}

export function AuthForm() {
  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("+61");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const resetMethod = (next: Method) => {
    setMethod(next);
    setMessage("");
    setOtp("");
    setOtpSent(false);
  };

  const submitEmail = async (event: FormEvent) => {
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

  const sendSms = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    let phone: string;
    try {
      phone = formatPhone(countryCode, phoneNumber);
    } catch (reason) {
      return setMessage(messageOf(reason));
    }
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: mode === "register" },
    });
    setBusy(false);
    if (error) return setMessage(`${error.message}。请确认 Supabase 已配置 SMS Provider。`);
    setOtpSent(true);
    setMessage("验证码已发送，请输入短信中的 6 位数字。");
  };

  const verifySms = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!/^\d{6}$/.test(otp)) return setMessage("请输入 6 位短信验证码。");
    setBusy(true);
    try {
      const phone = formatPhone(countryCode, phoneNumber);
      const { error } = await supabase!.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) setMessage(error.message);
    } catch (reason) {
      setMessage(messageOf(reason));
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-shell"><section className="auth-card">
    <span className="auth-mark">N</span><p className="eyebrow">NOMNOM FAMILY</p>
    <h1>{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
    <p>登录后即可与家庭成员共同安排菜单、冰箱和食记。</p>
    <div className="auth-method-tabs" role="tablist" aria-label="登录方式">
      <button type="button" role="tab" aria-selected={method === "email"} onClick={() => resetMethod("email")}>邮箱登录</button>
      <button type="button" role="tab" aria-selected={method === "phone"} onClick={() => resetMethod("phone")}>手机号登录</button>
    </div>
    {method === "email" ? <form className="auth-fields" onSubmit={submitEmail}>
      <label>邮箱<input aria-label="邮箱" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>密码<input aria-label="密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
      {message && <p className="auth-message" role="status">{message}</p>}
      <button type="submit" disabled={busy}>{busy ? "请稍候…" : mode === "login" ? "登录" : "注册"}</button>
    </form> : <form className="auth-fields" onSubmit={otpSent ? verifySms : sendSms}>
      <div className="auth-phone-group"><span>手机号</span><div className="phone-field">
        <select aria-label="国家或地区区号" value={countryCode} onChange={(event) => setCountryCode(event.target.value as CountryCode)}>
          <option value="+61">澳洲 +61</option><option value="+86">中国大陆 +86</option>
        </select>
        <input aria-label="手机号" type="tel" inputMode="tel" placeholder={countryCode === "+61" ? "0412 345 678" : "138 0013 8000"} value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setOtpSent(false); setOtp(""); }} required />
      </div></div>
      {otpSent && <label>短信验证码<input aria-label="短信验证码" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required /></label>}
      {message && <p className="auth-message" role="status">{message}</p>}
      <button type="submit" disabled={busy}>{busy ? "请稍候…" : otpSent ? "验证并登录" : "发送验证码"}</button>
      {otpSent && <button type="button" className="auth-switch" onClick={() => { setOtpSent(false); setOtp(""); setMessage(""); }}>重新发送验证码</button>}
    </form>}
    <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); setOtpSent(false); }}>{mode === "login" ? "没有账号？立即注册" : "已有账号？返回登录"}</button>
    {method === "phone" && <p className="auth-hint">短信由 Supabase 配置的 SMS Provider（如 Twilio）发送。</p>}
  </section></main>;
}
