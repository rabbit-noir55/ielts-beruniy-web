# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.
> Qo'lda ham tahrirlash mumkin — keyingi run shu yerdan davom etadi.

## Hozirgi holat

- Bosqich: 1-bo'lim (Telegram) — 1.6 (Playwright tekshiruvi) qoldi
- Oxirgi commit: 6d7b3e0
- Oxirgi run: 2026-11-01 16:13 UTC (erta to'xtagan)

## Bajarilgan

- [x] `src/utils/telegram.js` — `tg()`, `isTelegram()`
- [x] `index.html` — telegram-web-app.js skripti
- [x] `src/main.jsx` — ready/expand/setHeaderColor/disableVerticalSwipes
- [x] `Settings.jsx` — "Telegram bot" kartasi
- [x] `Login.jsx` / `Register.jsx` — Telegram ichida Google yashirilgan

## Keyingi qadam

`TASKS.md` 1.6 — Playwright bilan `/settings` ni tekshirish va screenshot olish.
Keyin 2-bo'lim (parol kartasi) → 3-bo'lim (davomat) → 4-bo'lim (mobil audit).

## Ma'lum muammolar

- Birinchi run'da Playwright MCP sozlanmagan edi — tuzatildi (`opencode.json` da `mcp.playwright`).
- Agent o'zi `scripts/cdp-screenshot.js` yozgan edi — o'chirildi. Faqat MCP ishlatilsin.
