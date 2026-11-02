package com.ieltsberuniy.app;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Sayt WebView'idan olingan DRF tokenini saqlaydi.
 * Skaner WebView'i shu token orqali API'ga murojaat qiladi —
 * natijada foydalanuvchi ikki marta login qilmaydi.
 */
final class TokenStore {

  private static final String PREFS = "ielts_app";
  private static final String KEY_TOKEN = "token";
  private static final String KEY_USER = "user";

  private final SharedPreferences prefs;

  TokenStore(Context context) {
    this.prefs = context.getApplicationContext()
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE);
  }

  String getToken() {
    return prefs.getString(KEY_TOKEN, "");
  }

  void setToken(String token) {
    prefs.edit().putString(KEY_TOKEN, token == null ? "" : token).apply();
  }

  void clear() {
    prefs.edit().remove(KEY_TOKEN).remove(KEY_USER).apply();
  }
}
