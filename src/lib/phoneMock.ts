type MockEnv = {
  VITE_PHONE_AUTH_MODE?: string;
  VITE_PHONE_MOCK_OTP?: string;
};

export function getPhoneMockConfig(env: MockEnv = import.meta.env as MockEnv) {
  if (env.VITE_PHONE_AUTH_MODE?.trim().toLowerCase() !== "mock") return null;
  const otp = env.VITE_PHONE_MOCK_OTP?.trim();
  if (!otp || !/^\d{6}$/.test(otp)) return null;
  return { otp };
}
