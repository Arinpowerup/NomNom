export type CountryCode = "+61" | "+86";

export function formatPhone(countryCode: CountryCode, input: string) {
  const digits = input.replace(/\D/g, "");
  if (countryCode === "+61") {
    const local = digits.startsWith("61") ? digits.slice(2) : digits;
    const normalized = local.startsWith("0") ? local.slice(1) : local;
    if (!/^4\d{8}$/.test(normalized)) throw new Error("请输入有效的澳洲手机号，例如 0412 345 678。");
    return `+61${normalized}`;
  }
  const local = digits.startsWith("86") ? digits.slice(2) : digits;
  if (!/^1[3-9]\d{9}$/.test(local)) throw new Error("请输入有效的中国大陆手机号，例如 138 0013 8000。");
  return `+86${local}`;
}
