package com.ieltsberuniy.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

/**
 * 1-tab: sayt. Foydalanuvchi o'z hisobida kiradi.
 * Login holati (DRF token) TokenStore'ga ko'chiriladi — skaner shundan foydalanadi.
 */
public class SiteFragment extends Fragment {

  static final String UA_SUFFIX = " IELTSApp/1.0";

  private WebView webView;
  private TokenStore store;

  @Override
  public void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    store = new TokenStore(requireContext());
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

    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    // Sayt ilova ichida ochilganini User-Agent orqali biladi (Google login yashiriladi).
    s.setUserAgentString(s.getUserAgentString() + UA_SUFFIX);

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        syncToken(view);
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost();

        // Sayt ichidagi navigatsiya — WebView'da qoladi.
        if (host.endsWith("netlify.app") || host.endsWith("onrender.com")
            || "appassets.androidplatform.net".equals(host)) {
          return false;
        }

        // Telegram, Google va boshqa tashqi havolalar — brauzerda.
        if (scheme.startsWith("http")) {
          startActivity(new Intent(Intent.ACTION_VIEW, uri));
        }
        return true;
      }
    });

    webView.loadUrl(BuildConfig.SITE_URL);
  }

  /** Sayt WebView'ining localStorage'idan tokenni o'qib, saqlaydi. */
  private void syncToken(WebView view) {
    view.evaluateJavascript(
        "(()=>{try{return localStorage.getItem('ielts_token')||''}catch(e){return ''}})()",
        value -> {
          String token = value;
          if (token == null || "null".equals(token)) {
            token = "";
          }
          if (token.length() >= 2 && token.startsWith("\"") && token.endsWith("\"")) {
            token = token.substring(1, token.length() - 1);
          }
          store.setToken(token);
        });
  }

  boolean canGoBack() {
    return webView != null && webView.canGoBack();
  }

  void goBack() {
    if (webView != null) {
      webView.goBack();
    }
  }

  /** Skaner tabiga o'tishdan oldin tokenni yangilab qo'yamiz. */
  void refreshToken() {
    if (webView != null) {
      syncToken(webView);
    }
  }

  @Override
  public void onDestroyView() {
    if (webView != null) {
      webView.setWebViewClient(null);
      webView.destroy();
      webView = null;
    }
    super.onDestroyView();
  }
}
