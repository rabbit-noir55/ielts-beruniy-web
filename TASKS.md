# TASKS — ish navbati

> Agent yuqoridan pastga qarab ishlaydi.
> Har vazifa **20–60 daqiqada** tugadigan darajada kichik.
> Format: `- [ ] <vazifa>` — bajarilgach agent uni `[x]` qiladi va commit qiladi.
> Layout ishlari **Playwright bilan haqiqiy brauzerda ko'rilmasa** bajarilgan hisoblanmaydi.

## 1. Telegram

- [x] `src/utils/telegram.js`: `tg()` va `isTelegram()` — `window.Telegram?.WebApp` xavfsiz o'qish.
- [x] `index.html`: `https://telegram.org/js/telegram-web-app.js` skriptini qo'shish.
- [x] `src/main.jsx`: `isTelegram()` bo'lsa `ready()`, `expand()`, `setHeaderColor?.("secondary_bg_color")`,
  `disableVerticalSwipes?.()`. Brauzerda hech qanday xato bo'lmasin.
- [x] `Settings.jsx`: "Telegram bot" kartasi — `href = import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/ielts_beruniy_bot"`,
  `target="_blank"`, `rel="noopener noreferrer"`. Telegram ichida karta ko'rsatilmaydi.
- [x] `Login.jsx` / `Register.jsx`: `isTelegram()` bo'lsa Google tugmasini yashirish.
- [x] Playwright: `/settings` da karta bor, `href` to'g'ri, tashqi navigatsiya yo'q, screenshot
  `screenshots/settings-telegram.png`. `window.Telegram` inject qilinganda karta yo'q.

## 2. Parolni ko'rish

- [x] `Settings.jsx`: "Parol" kartasi — `••••••••` + `Ko'rsatish` → Google tugmasi → parol + `Nusxalash`,
  60 soniyadan keyin yana yashiriladi. `password_plain` bo'sh bo'lsa xabar.
- [x] `src/utils/api.js`: `revealPassword(credential)` → `POST /auth/reveal-password/`.
  Xato `detail` ni o'zbekcha xabarga aylantirish.
- [x] Playwright: `page.route()` bilan API mock qilib, `Ko'rsatish` → Google → parol ko'rinishini tekshirish.

## 3. Davomat

- [ ] `src/utils/attendanceApi.js`: `scanAttendance({code, latitude, longitude, accuracy})`,
  `myAttendance()`. Xato `code` bo'yicha o'zbekcha xabar xaritasi.
- [ ] `/scan` sahifasi: kamera (`jsqr` bilan) + "Kodni qo'lda kiritish" varianti.
  Kamera ruxsati yo'q bo'lsa aniq xabar. `getUserMedia` faqat HTTPS'da ishlashini hisobga ol.
- [ ] Geolokatsiya: `navigator.geolocation.getCurrentPosition`, aniqligi past bo'lsa qayta urinish.
  Ruxsat rad etilsa tushunarli xabar (uz/ru/en).
- [ ] `/attendance` sahifasi: o'quvchining yozuvlari (sana ro'yxati). **Foiz yo'q.**
  Faqat `group` bor bo'lsa ko'rinadi; guruhsiz o'quvchiga "Siz guruhga biriktirilmagansiz".
- [ ] `App.jsx`: `/scan`, `/attendance` routelarini qo'shish, menyuda ko'rsatish.
- [ ] Capacitor: `npx cap init`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`,
  `@capacitor/camera`, `@capacitor/geolocation` o'rnatish, `capacitor.config.json`.
- [ ] Ilova qobig'i: 2 tab — "Davomat" (`/scan`) va "Sayt" (WebView → `VITE_SITE_URL`).
  Token WebView `localStorage` dan olinadi (ikki marta login bo'lmasin).
- [ ] `README-app.md`: Android Studio'da APK yig'ish yo'riqnomasi. **APK yig'ilmaydi**, faqat yo'riqnoma.

## 4. Mobil responsive audit

- [ ] **Faza 1 — ko'rish.** `src/App.jsx` dan barcha routelarni ol. Har biri uchun viewport `390x844`,
  `deviceScaleFactor 3`, mobile UA. `fullPage` screenshot → `screenshots/mobile/<route>.png`.
  Tekshir: gorizontal scroll (`scrollWidth > innerWidth`), ekrandan chiqqan element
  (`rect.right > innerWidth + 1`), tap target `< 44px`, kesilgan matn, console error.
  Natija: `MOBILE_AUDIT.md` — sahifa | muammo | jiddiylik | screenshot.
- [ ] **Faza 2 — tuzatish.** Eng jiddiydan boshlab, **har sahifa alohida commit**.
  Har tuzatishdan keyin o'sha sahifani qayta screenshot qilib solishtir.

---

## Qilmaslik kerak

- Dizaynni butunlay o'zgartirish
- `TASKS.md` da yozilmagan yangi npm paket qo'shish
- `package.json`, `package-lock.json`, `vite.config.js`, `netlify.toml` ni qo'lda tahrirlash
  (faqat paket o'rnatish buyrug'i orqali)
- Playwright bilan ko'rmasdan "responsive tuzatildi" deyish
