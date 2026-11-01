O'CHIRILGAN MOCK FAYLLARI
=========================

Bu fayllar nuqsonli bo'lgani uchun "Our Mock" ro'yxatidan olib tashlandi.
Ular o'chirilmadi — keyinchalik tuzatish uchun shu yerda saqlanadi.

Sabablari:

1. listening_test2.json
   - Audio umuman yo'q (media.audio_urls bo'sh). Listening testi sifatida
     foydalanib bo'lmaydi.
   - Mock 2 uchun READING ishlaydi va ro'yxatda qoldirilgan.

2. listening_test15.json
   - 36 savol (40 o'rniga). Part 2 da 19-20 savollar yo'q,
     part 3 da 21-26 savollar yo'q va qolgan savollarda raqamlar bo'sh.

3. listening_test17.json
   - 38 savol. Part 3 da 21-24 savollar yo'q, qolgan 4 savol raqamsiz.

4. listening_test23.json
   - 49 savol (1-49). Bu boshqa formatdagi test; IELTS band hisoblash
     (40 savolga asoslangan) noto'g'ri chiqadi.

5. reading_test12.json
   - 34 savol. Part 1 da 8-13 savollar yo'q.

6. reading_test15.json
   - 39 savol. Part 2 da 22-savol yo'q.

Qo'shimcha: reading_test23.json va reading_test24.json umuman mavjud emas
(shuning uchun Mock 23 va 24 da reading ko'rsatilmaydi).

Qaytarish uchun: faylni public/json/ourMocks/ ichiga qayta ko'chiring va
src/components/MockBookSection.jsx dagi MOCK_SKILLS ro'yxatiga
tegishli skillni qo'shing.
