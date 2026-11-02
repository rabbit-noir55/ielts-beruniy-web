package com.ieltsberuniy.app;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class TabsAdapter extends FragmentStateAdapter {

  private static final int TAB_COUNT = 2;

  public TabsAdapter(@NonNull FragmentActivity fragmentActivity) {
    super(fragmentActivity);
  }

  @NonNull
  @Override
  public Fragment createFragment(int position) {
    return WebViewFragment.newInstance(position);
  }

  @Override
  public int getItemCount() {
    return TAB_COUNT;
  }
}
