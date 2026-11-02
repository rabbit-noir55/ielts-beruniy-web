import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { C, SITE_URL } from "../theme";

/**
 * Sayt WebView'i. Foydalanuvchi shu yerda login qiladi.
 * Token localStorage'dan olinib, onToken orqali skanerga uzatiladi.
 *
 * injectedJavaScript: SPA bo'lgani uchun localStorage keyin o'zgaradi —
 * shuning uchun 1.5 sekundda bir marta tekshiramiz va o'zgarganda yuboramiz.
 */
const WATCH_TOKEN = `
(function () {
  try {
    var last = null;
    var push = function () {
      try {
        var t = localStorage.getItem('ielts_token') || '';
        if (t !== last) {
          last = t;
          window.ReactNativeWebView.postMessage(JSON.stringify({ token: t }));
        }
      } catch (e) {}
    };
    setInterval(push, 1500);
    push();
  } catch (e) {}
  true;
})();
`;

export default function SiteScreen({ onToken }) {
  const [loading, setLoading] = useState(true);
  const webRef = useRef(null);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={{ uri: SITE_URL }}
        applicationNameForUserAgent="IELTSApp/1.0"
        injectedJavaScript={WATCH_TOKEN}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (typeof data.token === "string") onToken(data.token);
          } catch {
            /* boshqa xabarlar */
          }
        }}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color={C.fg} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  web: { flex: 1, backgroundColor: C.bg },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
});
