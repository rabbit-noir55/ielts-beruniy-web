import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ERROR_TEXT, openSiteTab, scan, token } from "./api";

function haptic(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* qurilma qo'llamasligi mumkin */
  }
}

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

function Kicker({ children }) {
  return (
    <span className="kicker">
      <span className="dot" />
      {children}
    </span>
  );
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
        haptic([18, 40, 18]);
        setDone(data);
        stopCamera();
      } catch (err) {
        haptic(90);
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

  /* ── Tizimga kirilmagan ─────────────────────────────── */
  if (!hasToken) {
    return (
      <div className="app center">
        <div>
          <Kicker>Davomat</Kicker>
          <h1 className="title">Tizimga kiring</h1>
          <p className="subtitle">
            Davomatni belgilash uchun avval saytga kirishingiz kerak.
          </p>
        </div>
        <div className="card">
          <span className="card-label">Qadam 1</span>
          <p className="subtitle" style={{ color: "var(--muted-strong)" }}>
            «Sayt» tabiga o‘tib, o‘z hisobingizga kiring. Keyin bu yerga qaytib
            QR kodni skanerlang.
          </p>
          <button className="btn btn-primary btn-block" onClick={openSiteTab}>
            Saytni ochish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="head-row">
        <div>
          <Kicker>Davomat</Kicker>
          <h1 className="title">{done ? "Tayyor" : "QR kodni qarating"}</h1>
          <p className="subtitle">
            {done
              ? "Davomat muvaffaqiyatli belgilandi"
              : "Kod devordagi QR ichida"}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={openSiteTab}>
          Sayt
        </button>
      </div>

      {done && (
        <div className="card result ok">
          <div className="badge ok">✓</div>
          <h2>Belgilandi</h2>
          <p>
            {done.group} · {done.date}
          </p>
          <div className="chip">📍 {done.distance_m} m</div>
          <button className="btn btn-primary btn-block" onClick={reset} style={{ marginTop: 8 }}>
            Yana skanerlash
          </button>
        </div>
      )}

      {!done && error && (
        <div className="card result err">
          <div className="badge err">!</div>
          <h2>Belgilanmadi</h2>
          <p style={{ color: "rgba(255,255,255,0.75)" }}>{error}</p>
          <button className="btn btn-primary btn-block" onClick={reset} style={{ marginTop: 8 }}>
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
              <span className="frame-corner tl" />
              <span className="frame-corner tr" />
              <span className="frame-corner bl" />
              <span className="frame-corner br" />
              <span className="scanline" />
              <div className={`viewer-hint ${cameraError ? "err" : ""}`}>
                {cameraError
                  ? cameraError
                  : busy
                  ? "Joylashuv aniqlanmoqda…"
                  : "QR kodni ramka ichiga joylashtiring"}
              </div>
            </div>
          ) : (
            <form
              className="card"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) submit(code);
              }}
            >
              <span className="card-label">Qo‘lda kiritish</span>
              <div className="field">
                <label htmlFor="code">Davomat kodi</label>
                <input
                  id="code"
                  className="input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="KODNI KIRITING"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>
                {busy ? "Tekshirilmoqda…" : "Tekshirish"}
              </button>
            </form>
          )}

          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              setManual((m) => !m);
              setCameraError("");
              setError("");
            }}
          >
            {manual ? "Kamera bilan skanerlash" : "Kodni qo‘lda kiritish"}
          </button>
        </>
      )}
    </div>
  );
}
