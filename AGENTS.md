# AGENTS.md — EnthusiasticEnglish frontend

React 19 + Vite 8 + Tailwind 4. **JavaScript** (TypeScript emas). Deploy: Netlify.

## Komandalar

```bash
npm ci
npm run lint
npm run build
npm run dev -- --host 127.0.0.1 --port 5173
```

CI'da dev server allaqachon ishga tushirilgan: **http://127.0.0.1:5173**

Test yo'q — tekshiruv `lint` + `build` + **Playwright**.

> `npm run lint` hozir **42 ta warning, 0 error** beradi. Warninglarni tuzatishga vaqt sarflama.
> Faqat yangi **error** qo'shma.

## Ish tartibi (MAJBURIY)

1. `TASKS.md` ni o'qi — birinchi `[ ]` belgili ishni ol.
2. `PROGRESS.md` ni o'qi — oldingi run qayerda to'xtaganini bilish uchun.
3. `API_CONTRACT.md` ni o'qi — endpoint nomlari va formatlari shu yerda.
4. Har bo'lakdan keyin, albatta:

```bash
npm run lint
npm run build
bash scripts/agent-commit.sh "<qisqa izoh>"
```

5. `PROGRESS.md` ni yangila.

## Playwright — majburiy

Har qanday **UI yoki layout** ishi haqiqiy brauzerda ko'riladi. "Kod to'g'ri yozildi" — yetarli emas.

- Dev server: `http://127.0.0.1:5173`
- Mobil tekshiruv: viewport `390x844`, `deviceScaleFactor: 3`
- Screenshotlar: `screenshots/` papkasiga (`screenshots/mobile/<route>.png`)
- API kerak bo'lsa — `page.route()` bilan **mock** qil (CI'da backend yo'q)
- Login kerak bo'lsa — `localStorage` ga token inject qil yoki API'ni mock qil

Tekshirish ro'yxati (har sahifa uchun):

```
1. Sahifa xatosiz ochildi (console error yo'q)
2. Gorizontal scroll yo'q:  scrollWidth <= innerWidth
3. Ekrandan chiqqan element yo'q:  rect.right <= innerWidth + 1
4. Tap target:  button, a balandligi >= 44px (mumkin bo'lgan joyda)
5. Matn kesilmagan (ellipsis bo'lmasa)
6. Screenshot saqlangan
```

Screenshot va natijani `PROGRESS.md` ga yoz. **Ko'rmasdan "tuzatdim" dema.**

## Tuzilma

| Papka | Nima |
|---|---|
| `src/pages/` | sahifalar (31 ta) |
| `src/components/` | qayta ishlatiladigan komponentlar |
| `src/layouts/` | layoutlar |
| `src/utils/api.js` | **barcha** API chaqiriqlari |
| `src/utils/*Api.js` | domenga xos API qatlami |
| `src/utils/LanguageContext.jsx` | til (uz/ru/en) |
| `src/App.jsx` | routelar |

## Qoidalar

- API chaqiriqlari faqat `src/utils/api.js` yoki `*Api.js` orqali. Komponentda `fetch(` yozma.
- Tailwind 4 utility classlar. Yangi `.css` fayl ochma.
- Uslubni mavjud komponentlardan ko'chir — yangi dizayn tili o'ylab topma.
- Matnlar uch tilde (`uz`/`ru`/`en`) — `LanguageContext` orqali.
- Responsive: mavjud `sm:`/`md:` breakpointlardan foydalan.
- Yangi npm paket — **faqat `TASKS.md` da yozilganini** va faqat `npm install <paket>` bilan.
  `package.json` ni qo'lda tahrirlama.
- `.env`, `dist/`, `node_modules/`, `.netlify/`, `screenshots/` — commit qilinmaydi.
- O'lik kod va ishlatilmayotgan import qoldirma.

## Telegram ichida

- `isTelegram()` rost bo'lsa: Google login yashiriladi, "Telegram bot" kartasi ko'rsatilmaydi.
- `window.Telegram` yo'q muhitda hamma joyda optional chaining — sayt buzilmasligi shart.

## To'xtash sharti

`TASKS.md` da bajarilmagan ish qolmasa — hech narsa qilma. `PROGRESS.md` ga `TASKS tugadi` deb yoz va to'xta.
O'zingdan vazifa o'ylab topma.
