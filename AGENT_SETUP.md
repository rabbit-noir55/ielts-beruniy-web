# Agent sozlash — frontend

## 0. Muhim: repo yo'q

`D:\Desktop\ims\EnthusiasticEnglish\.git` papkasi **bo'sh**. GitHub Actions uchun repo kerak.

```bash
cd D:/Desktop/ims/EnthusiasticEnglish
rmdir .git
git init -b main
git add -A
git commit -m "initial: mavjud holat"
git remote add origin https://github.com/<user>/ielts-beruniy-web.git
git push -u origin main
```

`dist/`, `node_modules/`, `.env`, `screenshots/` — `.gitignore` da, ketmaydi.

## 1. Secret qo'shish

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Nomi | Qiymati |
|---|---|
| `OPENCODE_API_KEY` | OpenCode Console → Account → **Personal API keys** (`oc_sk_...`) |

## 2. Workflow ruxsatlari

**Settings → Actions → General → Workflow permissions** → **Read and write permissions**

## 3. Workflow nima qiladi

1. `npm ci`
2. `npx playwright install --with-deps chromium`
3. Dev server: `http://127.0.0.1:5173`
4. `opencode run` (agent)
5. Qoldiqni commit + push
6. **Screenshotlar artifact** (`screenshots-<run_id>`)

CI'da backend yo'q — agent API javoblarini `page.route()` bilan mock qiladi.
Shuning uchun mobile audit **layout** muammolarini topadi (overflow, tap target, kesilgan matn),
lekin real ma'lumot bilan bog'liq muammolarni emas.

## 4. Ishga tushirish

**Actions → OpenCode Agent → Run workflow**

| Maydon | Ma'nosi |
|---|---|
| `task` | Bo'sh qoldirsangiz `TASKS.md` navbatidan oladi |
| `minutes` | `330` = ~5.5 soat |

## 5. Natijani ko'rish

- **Screenshotlar**: run sahifasi pastida `screenshots-<run_id>` artifact
- **Job Summary**: status, oxirgi commit, `PROGRESS.md` boshi
- **`MOBILE_AUDIT.md`**: agent to'ldiradigan audit jadvali
- Repo: har commit `ai: ...` prefiksi bilan

## 6. Netlify

`.netlify/state.json` da faqat `siteId` — sayt GitHub'ga ulanmagan.
Ulash: Netlify → Site configuration → **Build & deploy → Link repository**.

Build: `npm run build`, publish: `dist` (`netlify.toml` da bor).

## 7. Qaytish

```bash
git fetch --tags
git tag | grep pre-ai
git reset --hard pre-ai-20260101-120000
git push --force-with-lease origin main
```

## 8. Muammolar

| Belgi | Sabab | Yechim |
|---|---|---|
| Dev server ishlamadi | port band yoki build xatosi | job logida `/tmp/dev.log` |
| Playwright brauzer yo'q | install step o'tmagan | `npx playwright install` step logi |
| `npm ci` yiqildi | lock bilan package.json mos emas | lokal `npm install` |
| Screenshot bo'sh | agent sahifani ochmagan | `PROGRESS.md` va log |
| `git push` 403 | permissions "Read" | 2-qadam |
