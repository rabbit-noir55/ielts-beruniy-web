package com.ieltsberuniy.app;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class MainActivity extends AppCompatActivity {

  private static final String[] TAB_TITLES = {"Davomat", "Sayt"};

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    ViewPager2 viewPager = findViewById(R.id.viewPager);
    TabLayout tabLayout = findViewById(R.id.tabLayout);

    TabsAdapter adapter = new TabsAdapter(this);
    viewPager.setAdapter(adapter);

    new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
      tab.setText(TAB_TITLES[position]);
    }).attach();
  }
}
