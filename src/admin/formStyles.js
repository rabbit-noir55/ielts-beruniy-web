export function inputCls(isDark) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] ${
    isDark
      ? "border-white/12 bg-[#0F0F11] text-white placeholder:text-white/25"
      : "border-black/12 bg-white text-black placeholder:text-black/25"
  }`;
}
