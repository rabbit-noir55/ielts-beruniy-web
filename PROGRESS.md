# PROGRESS

> Agent har ish birligidan keyin shu faylni yangilaydi.

## Hozirgi holat

- Bosqich: arxitektura qayta qurildi — davomat saytdan chiqarildi
- Oxirgi run: qo'lda (agent emas)

## Bajarilgan

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
