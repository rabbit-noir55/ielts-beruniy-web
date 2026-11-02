# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.
> Qo'lda ham tahrirlash mumkin — keyingi run shu yerdan davom etadi.

## Hozirgi holat

- Bosqich: 2-bo'lim (Parolni ko'rish) — 2.1 dan boshlanadi
- Oxirgi commit: 62390e9
- Oxirgi run: 2026-11-02 07:08 UTC

## Bajarilgan

- [x] `src/utils/telegram.js` — `tg()`, `isTelegram()`
- [x] `index.html` — telegram-web-app.js skripti
- [x] `src/main.jsx` — ready/expand/setHeaderColor/disableVerticalSwipes
- [x] `Settings.jsx` — "Telegram bot" kartasi
- [x] `Login.jsx` / `Register.jsx` — Telegram ichida Google yashirilgan
- [x] Playwright bilan `/settings` tekshiruvi
  - Brauzerda (window.Telegram yo'q) karta ko'rinadi
  - `href` = `https://t.me/ielts_beruniy_bot`, `target="_blank"`, `rel="noopener noreferrer"`
  - Telegram link balandligi 44px (tap target)
  - Gorizontal scroll yo'q (scrollWidth = 390)
  - `window.Telegram` inject qilinganda karta yo'q
  - Screenshot: `screenshots/settings-telegram.png`
- [x] `isTelegram()` ga `initData` tekshiruvi qo'shildi — brauzerda skript yuklansa ham karta ko'rinadi
- [x] `Settings.jsx` Telegram linkiga `min-h-11` (44px) qo'shildi

## Keyingi qadam

`TASKS.md` 2-bo'lim — Parolni ko'rish kartasi:
- `src/utils/api.js`: `revealPassword(credential)`
- `Settings.jsx`: parol kartasi UI
- Playwright: API mock + Google + parol ko'rinishi tekshiruvi

## Ma'lum muammolar

- Playwright tekshiruvi vaqtida `index.html` dan Telegram skripti vaqtinchalik o'chirildi va keyin tiklandi.
- Console'da `127.0.0.1:8000/api/auth/me/` ga ulanish xatolari bor — CI'da backend yo'q, kutilgan.
- `.playwright-mcp/` loglari commitga tushib qoldi; keyingi run'da ehtiyot bo'lish kerak.
