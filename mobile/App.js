import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import SiteScreen from "./src/screens/SiteScreen";
import ScanScreen from "./src/screens/ScanScreen";
import { C } from "./src/theme";

const TABS = [
  { key: "site", label: "Sayt" },
  { key: "scan", label: "Davomat" },
];

function Shell() {
  const [tab, setTab] = useState("scan");
  const [token, setToken] = useState("");
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.body}>
        {/* Sayt doim mount bo'lib turadi — sessiya yo'qolmasin. */}
        <View style={[styles.pane, tab !== "site" && styles.hidden]}>
          <SiteScreen onToken={setToken} />
        </View>

        {tab === "scan" && (
          <View style={styles.pane}>
            <ScanScreen token={token} onOpenSite={() => setTab("site")} />
          </View>
        )}
      </View>

      <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={styles.tab}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
              <View style={[styles.tabDot, active && styles.tabDotActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1 },
  pane: { flex: 1 },
  hidden: { display: "none" },

  tabbar: {
    flexDirection: "row",
    backgroundColor: "#0F0F11",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 4 },
  tabText: { color: "rgba(255,255,255,0.42)", fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: C.fg },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabDotActive: { backgroundColor: C.fg },
});
