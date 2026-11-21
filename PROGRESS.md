# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.

## Hozirgi holat

- Bosqich: auth/PIN tuzatishlari (2026-11-19)
- Oxirgi run: qo'lda tuzatishlar (Claude Code, 2026-11-19)

## Bajarilgan

### 2026-11-21 — Reading Challenge 1–3 materiallari

- [x] `Reading Challenge 1–3` PDFlari `public/books/`ga qo'shildi (Netlify statik:
      `https://ieltsberuniy.uz/books/reading-challenge-N.pdf`)
- [x] Round Up 3 guruhi uchun `GroupResource` yozuvlari (kind=pdf, order 10–12)
      production admin API orqali qo'shildi
- [x] Lessons → «PDF kitoblar» tabida 3 ta kitob ko'rinadi (desktop/mobil,
      gorizontal overflow yo'q); havolalar 200 + `application/pdf`
- [ ] Admin paneldagi fayl yuklash hozir Supabase `ee-images` bucket'ida 540
      (`PutObject`) xatosi beradi — storage alohida tuzatilishi kerak
- [x] Domen: `ieltsberuniy.uz` Netlify DNS'ga o'tdi, Let's Encrypt sertifikati
      chiqdi (2026-11-21); apex A `75.2.60.5`, www Netlify, MX/SPF/DKIM/DMARC saqlandi
- [ ] Lokal router DNS'i eski SERVFAIL'ni keshlagan — boshqa tarmoqda domen
      ishlayapti; router qayta ishga tushirilsa lokalda ham ochiladi

### 2026-11-21 — Telegram guruhi va bir qurilma bir hisob (UI)

- [x] `AdminTelegram` sahifasi: webhook holati, guruh qo'shish, bog'lash, sync,
      a'zolar modali (filtrlar, biriktirish/chiqarish); nav + route
- [x] `AdminGroups`: «Telegram guruhi» select, avto-biriktirish checkbox, kartada `TG:` badge
- [x] `src/utils/deviceIdentity.js`: `device_id`, fingerprint, platforma; barcha API
      so'rovlariga headerlar (`api.js`)
- [x] 409 `device_linked` → `ielts:device-conflict` event; `DeviceConflictModal` (App'da)
- [x] `DeviceLinkNotice` Login va Register sahifalarida (bog'langan hisob + uzish tasdiqi)
- [x] Settings: «Qurilma» kartasi (platforma, qisqa ID, bog'langan hisob, almashtirish)
- [x] `npm run lint` — 0 error; `npm run build` — OK
- [x] Playwright: login (desktop/mobil), conflict modal, Settings kartasi,
      admin Telegram (desktop/mobil), a'zolar modali, AdminGroups TG —
      gorizontal overflow yo'q; screenshotlar `screenshots/`da
- [x] Backend `0040`/`0041`/`0042` migratsiyalari Neon bazasiga qo'llandi;
      device endpointlari ishlayapti

### 2026-11-21 — TG ism-familiya majburiy qadami

- [x] `RequireAuth` `needs_name` bo'lsa `/complete-profile`ga yo'naltiradi
- [x] `CompleteProfile` sahifasi: ism/familiya (kamida 2 harf, raqamsiz), Telegram
      username ko'rsatiladi, saqlashdan keyin kerakli sahifaga qaytadi
- [x] Login/Google javobida `needs_name` bo'lsa to'g'ridan-to'g'ri shu sahifaga
- [x] Admin Telegram a'zolarida «ISM KUTILMOQDA» badge va «Telegram hisobi» yozuvi
- [x] Sinxron natijasida «N yangi hisob yaratildi» ko'rsatiladi
- [x] Playwright: `/` → `/complete-profile` gate, saqlash → `/`, mobil 390 overflow yo'q
- [x] `npm run lint` 0 error, `npm run build` OK

### 2026-11-20 — onlayn darslar, yangi admin va qurilma filtri

- [x] Lessons: guruhga mos pleylistlar, mocklar/PDF tablari, Cambridge va materiallar
- [x] `/lessons/playlist/:id`, `/lessons/video/:id`: pleyer (MP4 + YouTube), layk, izohlar
- [x] Admin shell: guruhlangan navigatsiya, yangi primitivlar (PageHeader, Tabs, StatCard, Modal)
- [x] AdminLessons: pleylist/video CRUD, izoh moderatsiyasi, muqova/thumbnail yuklash
- [x] AdminResources: PDF/mock/havola, fayl yuklash, guruh filtri
- [x] AdminGames/AdminTools: qurilma tanlash + badge; AdminMocks: Our/Cambridge tablari
- [x] Games/Tools: `?device=mobile|desktop` filtri (`utils/device.js`)
- [x] Settings: yon navigatsiya, profil kartasi, bo'lim anchorlari (mobil: chip nav)
- [x] Playwright: Lessons, playlist, video (layk/izoh), admin, qurilma filtri, Settings — overflow yo'q
- [x] Lessons qoidalari: video darslar hamma uchun; IELTS → Mock, Round Up → PDF,
      guruhsiz → ikkisi ham; Cambridge bo'limi Lessons'dan olib tashlandi
- [x] Home: ustoz yuklagan Cambridge mocklar bo'limi; Reading/Listening avval yuklangan
      Cambridge payloadini oladi (`source=cambridge&test=N`), keyin statik fayl
- [x] Cambridge **kitoblar**: Home'da "IELTS 21 2026" kartasi; Reading/Listening
      `/cambridge-books/<series>/<skill>/` ni birinchi so'raydi, 404 bo'lsa statik JSON
- [x] Admin: yangi «Cambridge kitoblar» sahifasi (bitta JSON = butun kitob),
      Lessons'dan mock tabi olib tashlandi

### 2026-11-20 — birinchi kirish uchun qo'llanma (onboarding)

- [x] `OnboardingTour`: spotlight, 8 qadam, Keyingi/Orqaga/O'tkazish, progress dots
- [x] Klaviatura: ← →, Escape, Tab focus trap; 44px tugmalar; reduced-motion
- [x] Desktop va mobil targetlar (`data-tour`); target yo'q bo'lsa markazlashgan qadam
- [x] Settings → Yordam: «Qo'llanmani ko'rish» (qayta ochish)
- [x] Playwright: desktop spotlight aniq mos, mobil bottom-nav ustida karta, overflow yo'q

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
