# Mobil responsive audit

**Muhit:** iPhone 14 viewport (390×844), mobile UA, `deviceScaleFactor` 3 (screenshot scale=device).  
**Sana:** 2026-11-02  
**Tekshiruv mezoni:**

- `scrollWidth > innerWidth` → gorizontal scroll
- `rect.right > innerWidth + 1` → ekrandan chiqqan element
- `button`/`a` balandligi < 44 px → kichik tap target
- `text-overflow: ellipsis` + `white-space !== normal` → kesilgan matn
- Browser console error (backend `auth/me` xatolari kutilgan, e'tiborsiz qoldirildi)

## Natija jadvali

| Sahifa | Muammo | Jiddiylik | Screenshot |
|---|---|---|---|
| `/` | Muammo yo'q | none | `screenshots/mobile/index.png` |
| `/mocks` | Muammo yo'q | none | `screenshots/mobile/mocks.png` |
| `/tools` | Muammo yo'q | none | `screenshots/mobile/tools.png` |
| `/tools/play/1` | Muammo yo'q | none | `screenshots/mobile/tools-play-1.png` |
| `/tools/ai` | AI asboblar paneli o'ngga chiqib ketgan (`overflowCount: 1`), "Task 1 Report" / "Task 1 Letter" tugmalari qisman yashirin | medium | `screenshots/mobile/tools-ai.png` |
| `/tools/band` | Muammo yo'q | none | `screenshots/mobile/tools-band.png` |
| `/tools/words` | Muammo yo'q | none | `screenshots/mobile/tools-words.png` |
| `/tools/dictionary` | Muammo yo'q | none | `screenshots/mobile/tools-dictionary.png` |
| `/tools/vocabulary` | Muammo yo'q | none | `screenshots/mobile/tools-vocabulary.png` |
| `/tools/speaking-draw` | Muammo yo'q | none | `screenshots/mobile/tools-speaking-draw.png` |
| `/competition` | Muammo yo'q | none | `screenshots/mobile/competition.png` |
| `/about-us` | Muammo yo'q | none | `screenshots/mobile/about-us.png` |
| `/academic/1/1/reading/1` | Muammo yo'q | none | `screenshots/mobile/academic-1-1-reading-1.png` |
| `/academic/1/1/speaking/part1` | Muammo yo'q | none | `screenshots/mobile/academic-1-1-speaking-part1.png` |
| `/speaking` | Muammo yo'q | none | `screenshots/mobile/speaking.png` |
| `/academic/1/1/writing/task1` | Muammo yo'q | none | `screenshots/mobile/academic-1-1-writing-task1.png` |
| `/writing` | Muammo yo'q | none | `screenshots/mobile/writing.png` |
| `/typing` | Muammo yo'q | none | `screenshots/mobile/typing.png` |
| `/games` | Muammo yo'q | none | `screenshots/mobile/games.png` |
| `/games/play/1` | Muammo yo'q | none | `screenshots/mobile/games-play-1.png` |
| `/group/test-group` | Muammo yo'q | none | `screenshots/mobile/group-test-group.png` |
| `/academic/1/1/listening/1` | Muammo yo'q | none | `screenshots/mobile/academic-1-1-listening-1.png` |
| `/mock/1/1/reading/1` | Muammo yo'q | none | `screenshots/mobile/mock-1-1-reading-1.png` |
| `/mock/1/1/listening/1` | Muammo yo'q | none | `screenshots/mobile/mock-1-1-listening-1.png` |
| `/intro` | Intro animatsiyasidagi SVG doiralar viewportdan katta (`overflowCount: 200`), lekin konteyner `overflow-hidden` bilan yashirilgan, gorizontal scroll yo'q | low | `screenshots/mobile/intro.png` |
| `/register` | Muammo yo'q | none | `screenshots/mobile/register.png` |
| `/login` | Muammo yo'q | none | `screenshots/mobile/login.png` |
| `/account` | Profil kartasidagi "Logout" tugmasi o'ng tomonga chiqib ketgan (`overflowCount: 2`) | high | `screenshots/mobile/account.png` |
| `/settings` | Muammo yo'q | none | `screenshots/mobile/settings.png` |
| `/scan` | Muammo yo'q | none | `screenshots/mobile/scan.png` |
| `/attendance` | Muammo yo'q | none | `screenshots/mobile/attendance.png` |
| `/lessons` | Muammo yo'q | none | `screenshots/mobile/lessons.png` |
| `/results/1/1` | Muammo yo'q | none | `screenshots/mobile/results-1-1.png` |
| `/experiment` | Muammo yo'q | none | `screenshots/mobile/experiment.png` |
| `/not-found` | Muammo yo'q | none | `screenshots/mobile/not-found.png` |

## Umumiy statistika

- **Jami sahifa:** 35
- **Gorizontal scroll:** 0 ta
- **Ekrandan chiqqan element (haqiqiy):** 2 ta (`/tools/ai`, `/account`)
- **Console error (frontend):** 0 ta
- **Kichik tap target:** barcha sahifalarda past darajada mavjud (asosan bottom tab label va kichik inline linklar)
- **Ellipsis:** barcha sahifalarda past darajada mavjud (ko'pincha ataylab qilingan)

## Faza 2 — eng jiddiy muammolar

1. **`/account`** — "Logout" tugmasi kartadan chiqib ketgan. Profil kartasining action qismini `flex-wrap` yoki kichikroq padding bilan sozlash kerak.
2. **`/tools/ai`** — AI asboblarining yon paneli mobil ekranda o'ngga chiqib ketgan. Mobil uchun panelni to'liq kenglikka o'tkazish yoki kontentni pastga joylashtirish kerak.
3. **`/intro`** — animatsiya elementlari katta, lekin foydalanuvchiga ta'sir qilmaydi. Low priority.

## Faza 2 — tuzatilgan

| Sahifa | Tuzatish | Screenshot |
|---|---|---|
| `/account` | Profil kartasi `flex-col sm:flex-row`, tugmalar `flex-wrap` qilindi | `screenshots/mobile/account-fixed.png` |
| `/tools/ai` | Sidebar mobilida `w-full` va tablar `flex-wrap`, kontent `flex-wrap gap-2` | `screenshots/mobile/tools-ai-fixed.png` |

Tuzatishlardan keyin ikkala sahifada ham `scrollWidth == innerWidth` va `overflowCount == 0`.
