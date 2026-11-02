package com.ieltsberuniy.app;

import android.webkit.JavascriptInterface;

/**
 * Skaner sahifasi uchun JS ko'prigi.
 * window.AndroidBridge.getToken() / window.AndroidBridge.openSiteTab()
 */
public class AndroidBridge {

  private final TokenStore store;
  private final Runnable openSite;

  AndroidBridge(TokenStore store, Runnable openSite) {
    this.store = store;
    this.openSite = openSite;
  }

  @JavascriptInterface
  public String getToken() {
    return store.getToken();
  }

  @JavascriptInterface
  public void openSiteTab() {
    if (openSite != null) {
      openSite.run();
    }
  }
}
