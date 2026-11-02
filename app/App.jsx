import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { scan, token, openSiteTab, ERROR_TEXT } from "./api";

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(ERROR_TEXT.no_location));
      return;
    }
    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    const attempt = (isRetry) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (coords.accuracy > 100 && !isRetry) attempt(true);
          else resolve(coords);
        },
        (err) => {
          if (!isRetry && err.code === 3) return attempt(true);
          const map = {
            1: "Geolokatsiya ruxsati rad etildi. Sozlamalardan ruxsat bering.",
            2: ERROR_TEXT.no_location,
            3: "Joylashuv aniqlash vaqti tugadi. Qayta urinib ko'ring.",
          };
          reject(new Error(map[err.code] || ERROR_TEXT.no_location));
        },
        options
      );
    };
    attempt(false);
  });
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const busyRef = useRef(false);

  const [hasToken] = useState(() => Boolean(token()));
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const submit = useCallback(
    async (rawCode) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError("");
      setDone(null);
      try {
        const coords = await getLocation();
        const data = await scan({
          code: rawCode.trim().toUpperCase(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setDone(data);
        stopCamera();
      } catch (err) {
        setError(err.message || "Xatolik yuz berdi.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [stopCamera]
  );

  // Kamera + QR skanerlash
  useEffect(() => {
    if (!hasToken || manual || done) return;
    let cancelled = false;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Kamera mavjud emas. Ilovada oching.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        tick();
      } catch (err) {
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraError("Kamera ruxsati berilmagan. Sozlamalardan ruxsat bering.");
        } else if (name === "NotFoundError") {
          setCameraError("Kamera topilmadi.");
        } else {
          setCameraError(err?.message || "Kamerani ishga tushirib bo'lmadi.");
        }
      }
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(img.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });
        if (qr?.data) {
          stopCamera();
          submit(qr.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [hasToken, manual, done, submit, stopCamera]);

  const reset = () => {
    setError("");
    setDone(null);
    setCode("");
    setCameraError("");
  };

  if (!hasToken) {
    return (
      <div className="wrap center">
        <div className="card">
          <h1>Tizimga kiring</h1>
          <p className="muted">
            Davomatni belgilash uchun avval saytga kirishingiz kerak.
          </p>
          <button className="btn primary" onClick={openSiteTab}>
            Saytni ochish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="head">
        <div>
          <h1>Davomat</h1>
          <p className="muted">QR kodni kameraga qarating</p>
        </div>
        <button className="btn ghost sm" onClick={openSiteTab}>
          Sayt
        </button>
      </header>

      {done && (
        <div className="card ok">
          <div className="tick">✓</div>
          <h2>Belgilandi</h2>
          <p className="muted">
            {done.group} — {done.date}
          </p>
          <p className="muted">Masofa: {done.distance_m} m</p>
          <button className="btn primary" onClick={reset}>
            Yana skanerlash
          </button>
        </div>
      )}

      {!done && error && (
        <div className="card err">
          <p className="err-text">{error}</p>
          <button className="btn primary" onClick={reset}>
            Qayta urinish
          </button>
        </div>
      )}

      {!done && !error && (
        <>
          {!manual ? (
            <div className="viewer">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} hidden />
              <div className="frame" />
              {busy && <div className="overlay">Joylashuv aniqlanmoqda…</div>}
              {cameraError && <div className="overlay err-text">{cameraError}</div>}
            </div>
          ) : (
            <form
              className="card"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) submit(code);
              }}
            >
              <label htmlFor="code">Davomat kodi</label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KODNI KIRITING"
                autoComplete="off"
                autoCapitalize="characters"
              />
              <button className="btn primary" disabled={busy || !code.trim()}>
                {busy ? "Tekshirilmoqda…" : "Tekshirish"}
              </button>
            </form>
          )}

          <button
            className="btn ghost wide"
            onClick={() => {
              setManual((m) => !m);
              setCameraError("");
              setError("");
            }}
          >
            {manual ? "Kamera bilan skanerlash" : "Kodni qo'lda kiritish"}
          </button>
        </>
      )}
    </div>
  );
}
