# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.
> Qo'lda ham tahrirlash mumkin — keyingi run shu yerdan davom etadi.

## Hozirgi holat

- Bosqich: 3-bo'lim (Davomat) — 3.1 dan boshlanadi
- Oxirgi commit: 5e9b456
- Oxirgi run: 2026-11-02 07:08 UTC

## Bajarilgan

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
