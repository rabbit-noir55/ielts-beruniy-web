package com.ieltsberuniy.app;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class TabsAdapter extends FragmentStateAdapter {

  private static final int TAB_COUNT = 2;

  private final TokenStore store;
  private final Runnable openSite;
  private SiteFragment siteFragment;
  private ScannerFragment scannerFragment;

  TabsAdapter(@NonNull FragmentActivity activity, TokenStore store, Runnable openSite) {
    super(activity);
    this.store = store;
    this.openSite = openSite;
  }

  @NonNull
  @Override
  public Fragment createFragment(int position) {
    if (position == 0) {
      siteFragment = new SiteFragment();
      return siteFragment;
    }
    scannerFragment = new ScannerFragment();
    scannerFragment.configure(store, openSite);
    return scannerFragment;
  }

  @Override
  public int getItemCount() {
    return TAB_COUNT;
  }

  SiteFragment getSiteFragment() {
    return siteFragment;
  }

  /** Skaner tabiga o'tilganda token yangilangan bo'lishi mumkin — sahifani qayta yuklaymiz. */
  void refreshScanner() {
    if (siteFragment != null) {
      siteFragment.refreshToken();
    }
    if (scannerFragment != null) {
      scannerFragment.reload();
    }
  }
}
