package com.ieltsberuniy.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class MainActivity extends AppCompatActivity {

  private static final String[] TAB_TITLES = {"Sayt", "Davomat"};
  private static final int REQ_PERMS = 1001;

  private static final String[] PERMISSIONS = {
      Manifest.permission.CAMERA,
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION,
  };

  private ViewPager2 viewPager;
  private TabsAdapter adapter;
  private TokenStore tokenStore;

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    tokenStore = new TokenStore(this);

    viewPager = findViewById(R.id.viewPager);
    TabLayout tabLayout = findViewById(R.id.tabLayout);

    adapter = new TabsAdapter(this, tokenStore, this::showSiteTab);
    viewPager.setAdapter(adapter);

    new TabLayoutMediator(tabLayout, viewPager, (tab, position) ->
        tab.setText(TAB_TITLES[position])
    ).attach();

    viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
      @Override
      public void onPageSelected(int position) {
        // Skaner tabi ochilganda tokenni qayta o'qish uchun sahifani yangilaymiz.
        if (position == 1) {
          adapter.refreshScanner();
        }
      }
    });

    requestPermissionsIfNeeded();

    if (BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true);
    }
  }

  private void showSiteTab() {
    runOnUiThread(() -> viewPager.setCurrentItem(0, true));
  }

  private void requestPermissionsIfNeeded() {
    boolean need = false;
    for (String p : PERMISSIONS) {
      if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
        need = true;
        break;
      }
    }
    if (need) {
      ActivityCompat.requestPermissions(this, PERMISSIONS, REQ_PERMS);
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                         @NonNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode == REQ_PERMS) {
      adapter.refreshScanner();
    }
  }

  @Override
  public void onBackPressed() {
    if (viewPager.getCurrentItem() == 0) {
      SiteFragment site = adapter.getSiteFragment();
      if (site != null && site.canGoBack()) {
        site.goBack();
        return;
      }
    }
    super.onBackPressed();
  }
}
