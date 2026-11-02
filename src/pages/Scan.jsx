import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { scanAttendance } from "../utils/attendanceApi";
import { useLang } from "../utils/LanguageContext";

const MESSAGES = {
  uz: {
    title: "Davomat",
    subtitle: "QR-kodni kameraga qarating yoki kodni qo'lda kiriting.",
    manual: "Kodni qo'lda kiritish",
    enterCode: "Davomat kodi",
    submit: "Tekshirish",
    scanning: "Kamera orqali skanerlash...",
    cameraDenied: "Kamera ruxsati rad etildi. Iltimos, brauzer sozlamalaridan ruxsat bering.",
    cameraUnavailable: "Kamera mavjud emas. Bu funksiya faqat HTTPS yoki ilova ichida ishlaydi.",
    cameraError: "Kamerani ishga tushirishda xatolik: ",
    geoDenied: "Geolokatsiya ruxsati rad etildi. Davomat uchun joylashuv talab qilinadi.",
    geoUnavailable: "Geolokatsiya aniqlanmadi. Iltimos, GPSni yoqing va ochiq joyga chiqing.",
    geoTimeout: "Geolokatsiya aniqlash vaqti tugadi. Qayta urining.",
    lowAccuracy: "GPS aniqligi past. Iltimos, ochiq joyga chiqib qayta urining.",
    fetchingLocation: "Joylashuv aniqlanmoqda...",
    success: (group, date) => `Davomat belgilandi: ${group} — ${date}.`,
  },
  ru: {
    title: "Посещаемость",
    subtitle: "Наведите камеру на QR-код или введите код вручную.",
    manual: "Ввести код вручную",
    enterCode: "Код посещаемости",
    submit: "Проверить",
    scanning: "Сканирование камерой...",
    cameraDenied: "Доступ к камере отклонен. Разрешите доступ в настройках браузера.",
    cameraUnavailable: "Камера недоступна. Эта функция работает только по HTTPS или в приложении.",
    cameraError: "Ошибка запуска камеры: ",
    geoDenied: "Доступ к геолокации отклонен. Для отметки посещаемости требуется местоположение.",
    geoUnavailable: "Не удалось определить местоположение. Включите GPS и выйдите на открытое место.",
    geoTimeout: "Время определения местоположения истекло. Попробуйте снова.",
    lowAccuracy: "Низкая точность GPS. Выйдите на открытое место и повторите попытку.",
    fetchingLocation: "Определение местоположения...",
    success: (group, date) => `Посещаемость отмечена: ${group} — ${date}.`,
  },
  en: {
    title: "Attendance",
    subtitle: "Point the camera at a QR code or enter the code manually.",
    manual: "Enter code manually",
    enterCode: "Attendance code",
    submit: "Check",
    scanning: "Scanning with camera...",
    cameraDenied: "Camera permission denied. Please allow access in browser settings.",
    cameraUnavailable: "Camera unavailable. This feature only works on HTTPS or inside the app.",
    cameraError: "Failed to start camera: ",
    geoDenied: "Location permission denied. Location is required for attendance.",
    geoUnavailable: "Could not determine location. Please enable GPS and move to an open area.",
    geoTimeout: "Location detection timed out. Please try again.",
    lowAccuracy: "GPS accuracy is low. Move to an open area and try again.",
    fetchingLocation: "Detecting location...",
    success: (group, date) => `Attendance marked: ${group} — ${date}.`,
  },
};

function useMessages() {
  const { lang } = useLang();
  return MESSAGES[lang] || MESSAGES.en;
}

export default function Scan({ theme }) {
  const isDark = theme === "dark";
  const t = useMessages();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handleScanRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(t.geoUnavailable));
        return;
      }
      const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };
      const attempt = (isRetry) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            if (accuracy > 100 && !isRetry) {
              attempt(true);
            } else {
              resolve({ latitude, longitude, accuracy });
            }
          },
          (err) => {
            if (!isRetry && err.code === 3) {
              attempt(true);
              return;
            }
            if (err.code === 1) reject(new Error(t.geoDenied));
            else if (err.code === 2) reject(new Error(t.geoUnavailable));
            else if (err.code === 3) reject(new Error(t.geoTimeout));
            else reject(new Error(err.message || t.geoUnavailable));
          },
          options
        );
      };
      attempt(false);
    });
  }, [t.geoDenied, t.geoUnavailable, t.geoTimeout]);

  useEffect(() => {
    handleScanRef.current = async (scannedCode) => {
      if (busy) return;
      setBusy(true);
      setError("");
      setResult(null);
      try {
        const location = await getLocation();
        const data = await scanAttendance({
          code: scannedCode,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        });
        setResult({ ok: true, ...data });
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    };
  }, [busy, getLocation]);

  // Kamerani ishga tushirish
  useEffect(() => {
    let stream = null;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError(t.cameraUnavailable);
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError(t.cameraDenied);
        } else if (err.name === "NotFoundError") {
          setCameraError(t.cameraUnavailable);
        } else {
          setCameraError(t.cameraError + (err.message || ""));
        }
      }
    };
    start();
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [t.cameraUnavailable, t.cameraDenied, t.cameraError]);

  // QR skanerlash
  useEffect(() => {
    if (!scanning || cameraError) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let raf = null;
    let paused = false;

    const tick = () => {
      if (paused) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });
        if (qr?.data) {
          paused = true;
          setScanning(false);
          handleScanRef.current(qr.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scanning, cameraError]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    handleScanRef.current(code.trim());
  };

  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/30 focus:ring-white"
      : "border-black/[0.12] bg-[#F6F5F2] text-black placeholder:text-black/30 focus:ring-black"
  }`;

  return (
    <div className={`mx-auto max-w-md px-6 py-10 ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>{t.subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {result?.ok && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          {t.success(result.group, result.date)}
        </div>
      )}

      {!manual ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-black/[0.08] bg-black dark:border-white/10">
          <div className="relative aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                {t.fetchingLocation}
              </div>
            )}
          </div>
          {cameraError && (
            <div className="p-4 text-center text-sm text-red-400">{cameraError}</div>
          )}
          {!cameraError && !busy && (
            <div className={`p-3 text-center text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
              {t.scanning}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="mb-4">
          <label className="mb-1 block text-sm font-semibold">{t.enterCode}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTHUS8X"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="mt-3 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {busy ? t.fetchingLocation : t.submit}
          </button>
        </form>
      )}

      <button
        onClick={() => {
          setManual((m) => !m);
          setError("");
          setResult(null);
          if (!manual) setScanning(false);
          else setScanning(true);
        }}
        className={`w-full rounded-full border px-6 py-3 text-sm font-bold transition ${
          isDark
            ? "border-white/20 text-white/70 hover:bg-white/5"
            : "border-black/20 text-black/70 hover:bg-black/5"
        }`}
      >
        {manual ? t.title : t.manual}
      </button>
    </div>
  );
}
