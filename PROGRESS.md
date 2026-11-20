# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.

## Hozirgi holat

- Bosqich: auth/PIN tuzatishlari (2026-11-19)
- Oxirgi run: qo'lda tuzatishlar (Claude Code, 2026-11-19)

## Bajarilgan

### 2026-11-20 — o'yinlar: dvigatel va 14 ta ichki o'yin

- [x] `src/games/`: canvas dvigateli, sprite'lar (vektor), WebAudio ovozlar, lug'at (book.js)
- [x] Canvas o'yinlar: Word Shooter, Falling Words, Word Snake, Bubble Pop
- [x] React o'yinlar: Memory Match, Spell Rush, Word Scramble, Quiz Rush, Word Chain,
      Hangman, Missing Letter, Typing Race, Word Ladder, Word Search
- [x] `/games/builtin/:key` route; Games hub'da Typing bilan jami 15 ta karta
- [x] HTML o'yinlar (ustoz qo'shgan) o'zgartirilmasdan ishlayveradi
- [x] Playwright: barcha o'yinlar ochiladi, canvas chiziladi, mobil overflow yo'q

### 2026-11-20 — biometrik tasdiqlash UI

- [x] `src/utils/webauthn.js`: base64url, platforma autentifikatori, 60 soniyalik proof cache
- [x] Settings: "Biometrik tasdiqlash" kartasi (yoqish / qayta ulash / o'chirish, qo'llab-quvvatlash tekshiruvi)
- [x] Competition: avval biometrik, qurilma qo'llamasa yoki xato bo'lsa PIN modaliga fallback
- [x] Playwright: Settings kartasi va PIN fallback tekshirildi (`screenshots/ui-check/`)

### 2026-11-19 — auth/PIN tuzatishlari

- [x] `Settings`: PIN mavjud bo'lsa `Joriy PIN` maydoni; `setPin(pin, oldPin)`
- [x] `Settings`: joriy parolni bilmasa Google bilan tasdiqlash (GSI) → `changePassword(..., credential)`
- [x] `Competition`: noto'g'ri PIN xatosi endi modal ichida ko'rinadi
- [x] Tekshiruv: lint 0 error, build ✓, Playwright mobil 390x844 — `screenshots/ui-check/`

### Sayt (public)
- [x] `Scan.jsx`, `Attendance.jsx`, `attendanceApi.js` **o'chirildi**
- [x] `App.jsx` dan `/scan`, `/attendance` routelari olib tashlandi
- [x] `MainLayout` dan menyu va pastki tab olib tashlandi
- [x] `telegram.js` ga `isInApp()` + `canUseGoogleLogin()` qo'shildi
- [x] Login/Register: ilova ichida Google tugmasi yashiriladi
- [x] Settings: parol kartasi faqat `role === "student"` uchun
- [x] Settings: Telegram kartasi ilova ichida ham yashiriladi

### App (React skaner)
- [x] `app/` — alohida Vite build (`npm run build:app`)
- [x] Kamera (jsQR) + GPS + qo'lda kod
- [x] Xato kodlari backend bilan bir xil
- [x] Build → `android/app/src/main/assets/scanner/`

### Android
- [x] `WebChromeClient` — kamera (`onPermissionRequest`) + GPS (`onGeolocationPermissionsShowPrompt`)
- [x] Runtime ruxsatlar (`MainActivity`)
- [x] `WebViewAssetLoader` — `https://appassets.androidplatform.net` (fetch ishlaydi)
- [x] 2 tab: Sayt / Davomat
- [x] Token ko'prigi: sayt WebView `localStorage` → `TokenStore` → `AndroidBridge.getToken()`
- [x] Sayt UA'siga `IELTSApp/1.0` qo'shiladi

## Keyingi qadam

- Haqiqiy telefonda sinash: login → Davomat tabi → QR skanerlash
- Netlify'ni repo'ga ulash

## Ma'lum muammolar

- `/attendance` (o'quvchi tarixi) hozircha yo'q — kerak bo'lsa appga qo'shiladi
- Bot hozircha faqat Mini App'da saytni ochadi
