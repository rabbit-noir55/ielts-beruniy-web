# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.
> Qo'lda ham tahrirlash mumkin — keyingi run shu yerdan davom etadi.

## Hozirgi holat

- Bosqich: 4-bo'lim (Mobil responsive audit)
- Oxirgi commit: kutilmoqda
- Oxirgi run: 2026-11-02

## Bajarilgan

- [x] ESLint: `android/` build assetlari ignore qilindi
- [x] `.gitignore` — `.playwright-mcp/` va `android/app/src/main/assets/public/` qo'shildi
- [x] 3-bo'lim (Davomat) to'liq tugatildi
- [x] 4.1-bo'lim — mobil responsive audit (35 sahifa screenshot + `MOBILE_AUDIT.md`)
- [x] 4.2-bo'lim — `/account` va `/tools/ai` overflow muammolari tuzatildi
- [x] `src/utils/telegram.js` — `tg()`, `isTelegram()`
- [x] `index.html` — telegram-web-app.js skripti
- [x] `src/main.jsx` — ready/expand/setHeaderColor/disableVerticalSwipes
- [x] `Settings.jsx` — "Telegram bot" kartasi
- [x] `Login.jsx` / `Register.jsx` — Telegram ichida Google yashirilgan
- [x] Playwright bilan `/settings` tekshiruvi (Telegram kartasi)
- [x] `isTelegram()` ga `initData` tekshiruvi qo'shildi
- [x] `Settings.jsx` Telegram linkiga `min-h-11` qo'shildi
- [x] `src/utils/api.js` — `revealPassword(credential)`
- [x] `Settings.jsx` — "Parol" kartasi (`••••••••` → Google → parol + Nusxalash, 60s timer)
- [x] Playwright: `fetch` mock + Google mock orqali parol ko'rinishi tekshirildi
  - `Ko'rsatish` tugmasi bosilganda Google test buttoni ko'rindi
  - Google button bosilganda parol `abc12345` ko'rildi
  - `Nusxalash` tugmasi ko'rindi
  - Screenshot: `screenshots/settings-password.png`

## Keyingi qadam

`TASKS.md` 3-bo'lim — Davomat:
- `src/utils/attendanceApi.js`: `scanAttendance`, `myAttendance`
- `/scan` sahifasi: kamera + qo'lda kiritish
- Geolokatsiya + xabarlar
- `/attendance` sahifasi
- `App.jsx`: `/scan`, `/attendance` routelari
- Capacitor sozlash
- Ilova qobig'i + README-app.md

## Ma'lum muammolar

- Console'da `127.0.0.1:8000/api/auth/me/` ga ulanish xatolari bor — CI'da backend yo'q, kutilgan.
- `.playwright-mcp/` loglari commitga tushib qoldi; `.gitignore` ga qo'shib o'chirish kerak.
