import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { scanAttendance } from "../api";
import { C, R } from "../theme";

async function getLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Geolokatsiya ruxsati rad etildi. Sozlamalardan ruxsat bering.");
  }
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    return pos.coords;
  } catch {
    throw new Error("Joylashuv aniqlanmadi. GPS yoqilganini tekshiring.");
  }
}

function Kicker({ children }) {
  return (
    <View style={s.kicker}>
      <View style={s.kickerDot} />
      <Text style={s.kickerText}>{children}</Text>
    </View>
  );
}

export default function ScanScreen({ token, onOpenSite }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState("scan"); // scan | busy | done | error
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const lockRef = useRef(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const submit = useCallback(
    async (rawCode) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setPhase("busy");
      setError("");
      setResult(null);
      try {
        const coords = await getLocation();
        const data = await scanAttendance({
          token,
          code: rawCode,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        Vibration.vibrate([0, 25, 40, 25]);
        setResult(data);
        setPhase("done");
      } catch (err) {
        Vibration.vibrate(120);
        setError(err.message || "Xatolik yuz berdi.");
        setPhase("error");
      } finally {
        lockRef.current = false;
      }
    },
    [token]
  );

  const reset = () => {
    setPhase("scan");
    setError("");
    setResult(null);
    setCode("");
  };

  if (!token) {
    return (
      <View style={[s.screen, s.center]}>
        <Kicker>Davomat</Kicker>
        <Text style={s.title}>Tizimga kiring</Text>
        <Text style={s.subtitle}>
          Avval saytda hisobingizga kiring, keyin shu yerga qaytib QR kodni skanerlang.
        </Text>
        <Pressable style={[s.btn, s.btnPrimary, { marginTop: 8 }]} onPress={onOpenSite}>
          <Text style={s.btnPrimaryText}>Saytni ochish</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Kicker>Davomat</Kicker>
      <Text style={s.title}>
        {phase === "done" ? "Tayyor" : "QR kodni qarating"}
      </Text>
      <Text style={s.subtitle}>
        {phase === "done" ? "Davomat muvaffaqiyatli belgilandi" : "Kod devordagi QR ichida"}
      </Text>

      {phase === "done" && (
        <View style={[s.card, s.cardOk]}>
          <View style={[s.badge, s.badgeOk]}>
            <Text style={[s.badgeText, { color: C.ok }]}>✓</Text>
          </View>
          <Text style={s.cardTitle}>Belgilandi</Text>
          <Text style={s.cardText}>
            {result?.group} · {result?.date}
          </Text>
          <View style={s.chip}>
            <Text style={s.chipText}>📍 {result?.distance_m} m</Text>
          </View>
          <Pressable style={[s.btn, s.btnPrimary, { marginTop: 8 }]} onPress={reset}>
            <Text style={s.btnPrimaryText}>Yana skanerlash</Text>
          </Pressable>
        </View>
      )}

      {phase === "error" && (
        <View style={[s.card, s.cardErr]}>
          <View style={[s.badge, s.badgeErr]}>
            <Text style={[s.badgeText, { color: C.err }]}>!</Text>
          </View>
          <Text style={s.cardTitle}>Belgilanmadi</Text>
          <Text style={[s.cardText, { color: "rgba(255,255,255,0.75)" }]}>{error}</Text>
          <Pressable style={[s.btn, s.btnPrimary, { marginTop: 8 }]} onPress={reset}>
            <Text style={s.btnPrimaryText}>Qayta urinish</Text>
          </Pressable>
        </View>
      )}

      {(phase === "scan" || phase === "busy") && (
        <>
          {!manual ? (
            <View style={s.cameraWrap}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={
                    phase === "scan"
                      ? ({ data }) => {
                          if (data) submit(data);
                        }
                      : undefined
                  }
                />
              ) : (
                <View style={s.cameraDenied}>
                  <Text style={s.cardText}>
                    Kamera ruxsati yo'q. Sozlamalardan ruxsat bering.
                  </Text>
                  <Pressable style={[s.btn, s.btnGhostSm]} onPress={requestPermission}>
                    <Text style={s.btnGhostText}>Ruxsat so'rash</Text>
                  </Pressable>
                </View>
              )}

              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />

              <View style={s.cameraHint}>
                <Text style={s.cameraHintText}>
                  {phase === "busy"
                    ? "Joylashuv aniqlanmoqda…"
                    : "QR kodni ramka ichiga joylashtiring"}
                </Text>
              </View>

              {phase === "busy" && (
                <View style={s.busyOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={s.card}>
              <Text style={s.cardLabel}>Qo'lda kiritish</Text>
              <Text style={s.inputLabel}>Davomat kodi</Text>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                placeholder="KODNI KIRITING"
                placeholderTextColor="rgba(255,255,255,0.22)"
                autoCapitalize="characters"
                autoCorrect={false}
                style={s.input}
              />
              <Pressable
                style={[s.btn, s.btnPrimary, { opacity: code.trim() ? 1 : 0.4 }]}
                disabled={!code.trim() || phase === "busy"}
                onPress={() => submit(code)}
              >
                <Text style={s.btnPrimaryText}>
                  {phase === "busy" ? "Tekshirilmoqda…" : "Tekshirish"}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[s.btn, s.btnGhost, { marginTop: 12 }]}
            onPress={() => setManual((m) => !m)}
          >
            <Text style={s.btnGhostText}>
              {manual ? "Kamera bilan skanerlash" : "Kodni qo'lda kiritish"}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  center: { justifyContent: "center", padding: 24, gap: 10 },

  kicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  kickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.mutedStrong },
  kickerText: {
    color: C.mutedStrong,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  title: { color: C.fg, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginTop: 6 },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 20 },

  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: 20,
    gap: 10,
    marginTop: 6,
  },
  cardOk: {
    borderColor: "rgba(16,185,129,0.45)",
    backgroundColor: "rgba(16,185,129,0.10)",
    alignItems: "center",
  },
  cardErr: {
    borderColor: "rgba(239,68,68,0.45)",
    backgroundColor: "rgba(239,68,68,0.10)",
    alignItems: "center",
  },
  cardLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardTitle: { color: C.fg, fontSize: 22, fontWeight: "800" },
  cardText: { color: C.mutedStrong, fontSize: 14, textAlign: "center", lineHeight: 20 },

  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOk: { backgroundColor: "rgba(16,185,129,0.18)" },
  badgeErr: { backgroundColor: "rgba(239,68,68,0.18)" },
  badgeText: { fontSize: 30, fontWeight: "800" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { color: C.mutedStrong, fontSize: 12 },

  cameraWrap: {
    height: 420,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 6,
  },
  cameraDenied: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: "rgba(255,255,255,0.9)",
  },
  cornerTL: { top: "12%", left: "10%", borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: "12%", right: "10%", borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: "12%", left: "10%", borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: "12%", right: "10%", borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

  cameraHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  cameraHintText: { color: "rgba(255,255,255,0.85)", fontSize: 13 },

  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  inputLabel: { color: C.muted, fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#0F0F11",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.input,
    color: C.fg,
    fontSize: 17,
    letterSpacing: 2,
    textAlign: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontWeight: "600",
  },

  btn: {
    minHeight: 52,
    borderRadius: R.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  btnPrimary: { backgroundColor: C.accent },
  btnPrimaryText: { color: C.accentContrast, fontSize: 15, fontWeight: "800" },
  btnGhost: { borderWidth: 1, borderColor: C.border },
  btnGhostSm: { borderWidth: 1, borderColor: C.border, minHeight: 44, marginTop: 4 },
  btnGhostText: { color: C.fg, fontSize: 15, fontWeight: "700" },
});
