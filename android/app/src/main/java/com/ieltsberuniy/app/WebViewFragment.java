package com.ieltsberuniy.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class WebViewFragment extends Fragment {

  private static final String ARG_POSITION = "position";

  public static WebViewFragment newInstance(int position) {
    WebViewFragment fragment = new WebViewFragment();
    Bundle args = new Bundle();
    args.putInt(ARG_POSITION, position);
    fragment.setArguments(args);
    return fragment;
  }

  @Nullable
  @Override
  public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
    return inflater.inflate(R.layout.fragment_webview, container, false);
  }

  @Override
  public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
    super.onViewCreated(view, savedInstanceState);

    int position = getArguments() != null ? getArguments().getInt(ARG_POSITION, 0) : 0;

    WebView webView = view.findViewById(R.id.webview);
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    webView.setWebViewClient(new WebViewClient());

    String url;
    if (position == 0) {
      url = BuildConfig.SITE_URL + "/scan";
    } else {
      url = BuildConfig.SITE_URL;
    }
    webView.loadUrl(url);
  }
}
