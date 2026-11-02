# IELTS Beruniy — Android ilovasi yo'riqnomasi

Bu loyiha [Capacitor](https://capacitorjs.com/) yordamida Android ilovasiga aylanadi.

## Talablar

- Node.js 20+
- Android Studio (eng so'nggi stable versiya)
- Android SDK 24+ (`minSdkVersion` 24)
- JDK 17

## Sozlash

```bash
npm ci
npm run build
npx cap sync android
```

## Android Studio'da ochish

```bash
npx cap open android
```

## Ilova qobig'i — 2 tab

Ilova ikkita asosiy tabdan iborat:

1. **Davomat** — WebView ichida `/scan` sahifasi ochiladi.
2. **Sayt** — WebView ichida `VITE_SITE_URL` (masalan, `https://ieltsberuniy.netlify.app`) ochiladi.

Foydalanuvchi saytda bir marta login qilganda, token WebView `localStorage` ga saqlanadi. Davomat tabi ham shu WebView sessiyasidan foydalanadi, shuning uchun ikki marta login qilish talab etilmaydi.

### Implementatsiya

Quyidagi fayllar loyihada allaqachon yaratildi va sozlandi:

- `android/app/src/main/java/com/ieltsberuniy/app/MainActivity.java`
- `android/app/src/main/java/com/ieltsberuniy/app/TabsAdapter.java`
- `android/app/src/main/java/com/ieltsberuniy/app/WebViewFragment.java`
- `android/app/src/main/res/layout/activity_main.xml`
- `android/app/src/main/res/layout/fragment_webview.xml`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/build.gradle`

`MainActivity` ichida `ViewPager2` + `TabLayout` orqali ikki tab ochiladi:

1. **Davomat** — WebView ichida `BuildConfig.SITE_URL + "/scan"` ochiladi.
2. **Sayt** — WebView ichida `BuildConfig.SITE_URL` ochiladi.

Foydalanuvchi Sayt tabida login qilganda token WebView `localStorage` ga saqlanadi. Davomat tabi ham shu `localStorage` dan foydalanadi, shuning uchun ikki marta login qilish talab etilmaydi.

Agar o'zingiz qayta sozlamoqchi bo'lsangiz, `MainActivity.java` quyidagicha bo'ladi:

```java
package com.ieltsberuniy.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class MainActivity extends AppCompatActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    ViewPager2 viewPager = findViewById(R.id.viewPager);
    TabLayout tabLayout = findViewById(R.id.tabLayout);

    TabsAdapter adapter = new TabsAdapter(this);
    viewPager.setAdapter(adapter);

    new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
      if (position == 0) tab.setText("Davomat");
      else tab.setText("Sayt");
    }).attach();
  }
}
```


`android/app/src/main/res/layout/activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical">

  <com.google.android.material.tabs.TabLayout
    android:id="@+id/tabLayout"
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />

  <androidx.viewpager2.widget.ViewPager2
    android:id="@+id/viewPager"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1" />
</LinearLayout>
```

Har bir tab uchun alohida `WebViewFragment` yaratiladi. Fragment ichidagi `WebView` quyidagicha sozlanadi:

```java
WebView webView = view.findViewById(R.id.webview);
WebSettings settings = webView.getSettings();
settings.setJavaScriptEnabled(true);
settings.setDomStorageEnabled(true);
settings.setDatabaseEnabled(true);
webView.setWebViewClient(new WebViewClient());

if (position == 0) {
  webView.loadUrl("https://ieltsberuniy.netlify.app/scan");
} else {
  webView.loadUrl(BuildConfig.SITE_URL); // BuildConfigFields orqali
}
```

`android/app/build.gradle` da `buildConfigField` qo'shing:

```gradle
android {
  defaultConfig {
    buildConfigField "String", "SITE_URL", "\"https://ieltsberuniy.netlify.app\""
  }
}
```

## Ruxsatlar

`AndroidManifest.xml` ga quyidagilarni qo'shing:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Android 6+ (API 23+) uchun runtime ruxsatlarini so'rang.

## APK yig'ish

Android Studio'da:

1. **Build → Generate Signed Bundle / APK...** ni tanlang.
2. APK variantini tanlang.
3. Key store faylini tanlang yoki yangi yaratib, `key0` kabi alias bilan to'ldiring.
4. **release** variantini tanlang.
5. `app-release.apk` fayli loyihaga yuklanadi.

> **Eslatma:** CI'da APK yig'ilmaydi — faqat yig'ish yo'riqnomasi yozildi.

## Yangilash

Frontend o'zgargach:

```bash
npm run build
npx cap copy android
```

Keyin Android Studio'da **Build → Rebuild Project**.
