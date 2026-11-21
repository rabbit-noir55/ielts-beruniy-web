# API_CONTRACT — frontend ↔ backend

Bu fayl ikkala repoda bir xil. Agent nomlar yoki formatlarni o'zgartirmasin.

Base URL: `VITE_API_URL` (masalan `https://ieltsberuniy.onrender.com/api`)

Auth: `Authorization: Token <key>` (DRF Token).

---

## 1. Auth (mavjud)

| Method | Path | Body | Javob |
|---|---|---|---|
| POST | `/auth/login/` | `{email, password}` | `{token, user}` |
| POST | `/auth/register/` | `{email, password, first_name, last_name}` | `{token, user}` |
| POST | `/auth/google/` | `{credential}` | `{token, user}` |
| GET | `/auth/me/` | — | `user` |

`user`:

```json
{
  "id": 1, "email": "a@b.com", "first_name": "Ali", "last_name": "Valiyev",
  "full_name": "Ali Valiyev", "role": "student", "group": 3,
  "group_detail": {"id": 3, "name": "IELTS-1", "slug": "ielts-1", "group_type": "ielts"},
  "is_blocked": false, "has_pin": false, "is_examiner": false
}
```

---

## 2. Parol va PIN

### `POST /auth/change-password/` — auth talab qilinadi

```json
{ "old_password": "...", "new_password": "...", "credential": "<Google ID token> (ixtiyoriy)" }
```

Paroli yo'q (Telegram/Google) foydalanuvchi `old_password`ni bo'sh qoldiradi.
Joriy parolni bilmaydigan foydalanuvchi `credential` bilan Google hisobini tasdiqlaydi.

| Holat | HTTP | Body |
|---|---|---|
| OK | 200 | `{"detail": "Parol muvaffaqiyatli ozgartirildi."}` |
| Eski parol xato | 400 | `{"detail": "Eski parol notogri."}` |
| Google hisobi mos emas | 403 | `{"detail": "Google hisobi mos kelmadi."}` |
| Yangi parol qisqa | 400 | `{"detail": "Yangi parol kamida 6 belgidan iborat bolishi kerak."}` |

### `POST /auth/set-pin/` — auth talab qilinadi

```json
{ "pin": "1234", "old_pin": "1234" }
```

PIN birinchi marta o'rnatilganda `old_pin` kerak emas; mavjud PINni
almashtirishda **talab qilinadi**. PIN `make_password` bilan hash qilinadi.

| Holat | HTTP | Body |
|---|---|---|
| OK | 200 | `{"ok": true, "has_pin": true}` |
| Format xato | 400 | `{"detail": "PIN 4 xonali son bo'lishi kerak."}` |
| Joriy PIN xato | 403 | `{"detail": "Joriy PIN noto'g'ri."}` |

### Biometrik tasdiqlash (WebAuthn) — auth talab qilinadi

`POST /auth/webauthn/register/options/` → `navigator.credentials.create()` uchun parametrlar.
`POST /auth/webauthn/register/` → `{credential_id, client_data_json, attestation_object, transports}`.
`POST /auth/webauthn/options/` → `navigator.credentials.get()` uchun challenge.
`POST /auth/webauthn/remove/` → `{credential_id}` (bo'sh bo'lsa hammasi).

`user` obyektida `has_biometric` maydoni bor. Baho qo'yishda:

```json
{
  "student": 12, "skill": "writing", "auth_method": "biometric",
  "webauthn": {"credential_id": "...", "client_data_json": "...", "authenticator_data": "...", "signature": "..."}
}
```

Biometrik mavjud bo'lmasa `auth_method: "pin"` va `pin` ishlatiladi.

---

## 3. Telegram (yangi)

`POST /telegram/link-url/` — auth

```json
{ "url": "https://t.me/ielts_beruniy_bot?start=abc123" }
```

`POST /telegram/webhook/<secret>/` — Telegram serveridan, `AllowAny`, CSRF exempt.
Javob har doim `{"ok": true}` (200), secret xato bo'lsa 403.

---

## 4. Davomat (yangi)

### `POST /attendance/scan/` — auth

So'rov:

```json
{ "code": "ENTHUS8X", "latitude": 41.3111, "longitude": 69.2405, "accuracy": 25 }
```

Muvaffaqiyat (200):

```json
{ "ok": true, "date": "2026-11-01", "distance_m": 42, "group": "IELTS-1" }
```

Xato:

```json
{ "error": "Siz markaz hududida emassiz", "code": "too_far", "distance_m": 420 }
```

| code | HTTP | Ma'nosi |
|---|---|---|
| `invalid_code` | 400 | QR kod noto'g'ri |
| `external_user` | 403 | Guruhga biriktirilmagan |
| `blocked` | 403 | Bloklangan |
| `no_location` | 400 | GPS aniqlanmadi |
| `low_accuracy` | 400 | GPS aniqligi past |
| `too_far` | 400 | Markaz hududida emas |
| `no_lesson` | 400 | Bugun bu guruhda dars yo'q |
| `no_schedule` | 400 | Guruh jadvalida vaqt yo'q |
| `out_of_window` | 400 | Dars vaqti oynasidan tashqarida (oyna: `schedule_time` .. +15 daqiqa) |
| `already_marked` | 409 | Bugun allaqachon belgilangan |

### `GET /attendance/my/` — auth

```json
{ "results": [ { "date": "2026-11-01", "source": "qr", "distance_m": 42 } ] }
```

### `GET /attendance/today/?group=<id>` — admin

```json
{
  "group": {"id": 3, "name": "IELTS-1"},
  "is_lesson_day": true,
  "students": [
    {"id": 1, "full_name": "Ali Valiyev", "present": true, "distance_m": 42, "source": "qr"},
    {"id": 2, "full_name": "Zarina Karimova", "present": false}
  ]
}
```

### `POST /attendance/manual/` — admin

```json
{ "student": 2, "date": "2026-11-01" }
```

Javob: `{"ok": true, "date": "2026-11-01"}`

---

## 5. Xato formati

Mavjud auth API: `{"detail": "..."}`
Yangi davomat API: `{"error": "<odam o'qiydigan matn>", "code": "<mashina kodi>"}`

Frontend **`code`** bo'yicha xabar tanlaydi, `error` ni to'g'ridan-to'g'ri ko'rsatmaydi (tarjima uchun).

---

## 6. Onlayn darslar

| Endpoint | Method | Izoh |
|---|---|---|
| `/lessons/overview/` | GET | `{group, group_type, is_teacher, playlists[], resources[]}` |
| `/lessons/playlists/` | GET | guruhga mos pleylistlar |
| `/lessons/playlists/<id>/` | GET | pleylist + videolar |
| `/lessons/videos/<id>/` | GET | video + playlist + siblings |
| `/lessons/videos/<id>/like/` | POST | `{liked, likes}` |
| `/lessons/videos/<id>/comments/` | GET/POST | `{enabled, comments[]}` / `{comment}` |
| `/lessons/comments/<id>/delete/` | POST | muallif yoki ustoz |
| `/lessons/comments/<id>/hide/` | POST | ustoz |
| `/lessons/resources/` | GET | PDF/mock materiallar |
| `/cambridge-mocks/` | GET | Cambridge ro'yxati |
| `/cambridge-mocks/<series>/<skill>/` | GET | payload |
| `/cambridge-books/` | GET | `{count, items[]}` — `{series, year, title, skills}` |
| `/cambridge-books/<series>/<skill>/` | GET | kitob skill payload'i |

Ustoz Cambridge kitobini bitta JSON sipida qo'shadi: `{book, type, series_id, tests}`.
Admin: `GET /admin/mocks/book/<series>/`, `POST /admin/mocks/` →
`action: "save_book" | "delete_book" | "publish_book"`.
| `/mocks/<series>/<skill>/?source=cambridge` | GET | Cambridge payloadi |

Admin kontent: `/admin/lessons/`, `/admin/lessons/<id>/`, `/admin/resources/`,
`/admin/resources/upload/` (multipart). Qurilma filtri: `/games/?device=desktop|mobile`,
`/tools/?device=...`.

**Qoidalar:** video darslar barcha guruhlarga ochiq. Materiallar: IELTS → mock,
Round Up → PDF, guruhsiz → ikkisi ham. **Mocklar Lessons'da ko'rinmaydi** — ular
Mocktest (Our Mock) va Cambridge kitoblar bo'limlarida. Reading/Listening avval
`/cambridge-books/<series>/<skill>/` ni so'raydi, 404 bo'lsa statik JSON'ga tushadi.

---

## 7. Telegram guruh va qurilma

Admin: `/admin/telegram/` (webhook holati, `set_webhook`/`delete_webhook`/
`set_commands`), `/admin/telegram/chats/` (`add`, `link`, `unlink`, `auto_sync`,
`sync`, `refresh`, `delete`, `assign`, `unassign`), `/admin/telegram/chats/<id>/`
(a'zolar + `status`/`site`/`q` filtrlari). `/admin/groups/` `save` da
`telegram_chat`, `telegram_auto_sync`; ro'yxatda `telegram_chats[]`.

Qurilma: `src/utils/deviceIdentity.js` barcha so'rovlarga `X-Device-Id`,
`X-Device-Fingerprint`, `X-Device-Platform` qo'shadi. `GET /auth/device/status/`
→ `{linked, platform, can_switch, account}`; `POST /auth/device/release/`.
Auth endpointlari boshqa hisob bog'langan qurilmada `409` + `code:
"device_linked"` qaytaradi — `request()` `ielts:device-conflict` eventini
yuboradi, `DeviceConflictModal` tasdiqlash bilan uzadi. Login/Register'da
`DeviceLinkNotice`, Settings'da «Qurilma» kartasi.
