package com.ieltsberuniy.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.webkit.WebViewAssetLoader;

/**
 * 2-tab: davomat skaneri.
 *
 * Sahifa ilova ichida (assets) — saytga umuman bog'lanmagan.
 * Kamera va GPS WebView'da ishlashi uchun:
 *   - WebChromeClient.onPermissionRequest  (getUserMedia)
 *   - WebChromeClient.onGeolocationPermissionsShowPrompt (geolocation)
 *   - Activity'dagi runtime ruxsatlar (MainActivity)
 */
public class ScannerFragment extends Fragment {

  private static final String START_URL =
      "https://appassets.androidplatform.net/assets/scanner/index.html";

  private WebView webView;
  private TokenStore store;
  private Runnable openSite;

  /** Fragment'da public no-arg konstruktor bo'lishi shart (holat tiklash uchun). */
  public ScannerFragment() {
  }

  void configure(TokenStore tokenStore, Runnable openSiteTab) {
    this.store = tokenStore;
    this.openSite = openSiteTab;
  }

  @Nullable
  @Override
  public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
    return inflater.inflate(R.layout.fragment_webview, container, false);
  }

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
    super.onViewCreated(view, savedInstanceState);

    webView = view.findViewById(R.id.webview);

    // file:// o'rniga https origin — fetch() va getUserMedia ishonchli ishlaydi.
    // AssetsPathHandler faqat Context qabul qiladi: "/assets/" -> assets/ papkasi.
    WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(requireContext()))
        .build();

    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setGeolocationEnabled(true);
    s.setAllowFileAccess(false);
    s.setMediaPlaybackRequiresUserGesture(false);

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        return assetLoader.shouldInterceptRequest(r.getUrl());
      }
    });

    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(PermissionRequest request) {
        // Sahifa lokal (assets) — ruxsatni beramiz.
        request.grant(request.getResources());
      }

      @Override
      public void onGeolocationPermissionsShowPrompt(String origin,
                                                     GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
      }
    });

    webView.addJavascriptInterface(new AndroidBridge(store, openSite), "AndroidBridge");

    webView.loadUrl(START_URL);
  }

  /** Tab qayta tanlanganda tokenni yangilash uchun sahifani qayta yuklaymiz. */
  void reload() {
    if (webView != null) {
      webView.reload();
    }
  }

  @Override
  public void onDestroyView() {
    if (webView != null) {
      webView.removeJavascriptInterface("AndroidBridge");
      webView.setWebChromeClient(null);
      webView.setWebViewClient(null);
      webView.destroy();
      webView = null;
    }
    super.onDestroyView();
  }
}
