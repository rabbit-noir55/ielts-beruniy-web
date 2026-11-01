import { useRef, useEffect, useState } from "react";

/** Range ichidagi matnli node'larni span bilan o'rash */
export function wrapRangeTextNodes(range, span) {
  if (!range || !span || range.collapsed) return;

  const fragment = range.extractContents();
  const wrapper = span.cloneNode(true);

  if (fragment.childNodes.length === 0) {
    range.insertNode(wrapper);
    range.setStartBefore(wrapper);
    range.setEndAfter(wrapper);
    return;
  }

  wrapper.appendChild(fragment);
  range.insertNode(wrapper);
  range.setStartBefore(wrapper);
  range.setEndAfter(wrapper);
}

/** answers massiv yoki obyektini normallashtiradi */
export function parseAnswers(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === "object" && item !== null
        ? (item.answer ?? item.text ?? item.correct ?? "")
        : item,
    );
  }
  if (raw && typeof raw === "object") {
    const map = {};
    for (const k of Object.keys(raw)) {
      let val = raw[k];
      if (typeof val === "object" && val !== null)
        val = val.answer ?? val.text ?? val.correct ?? val;
      map[String(k)] = val;
    }
    return map;
  }
  return {};
}

/**
 * Javob variantlarini `/` yoki `|` bo'yicha ajratadi.
 * Listening JSON'da `/` (masalan "14th/14/fourteenth"),
 * Reading JSON'da `|` (masalan "defenses | defences") ishlatiladi.
 */
export function splitAlternatives(str) {
  return String(str)
    .split(/[|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** vaqtni mm:ss formatiga o'tkazadi */
export function formatTime(t) {
  if (isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** localStorage debounce yozish uchun */
export function useDebouncedLocalStorage(key, value, delay = 600) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [key, value, delay]);
}

/**
 * YANGI: Modal/popup kabi `if (!visible) return null;` bilan ishlaydigan
 * komponentlar odatda yopilganda DARHOL DOMdan yo'qoladi — shu sababli
 * "chiqish" (fade/scale-out) animatsiyasi ko'rinmay qoladi.
 *
 * Bu hook `isVisible`ni kuzatib boradi va `false` bo'lib qolgandan keyin
 * ham komponentni yana `delay` millisekund davomida "render qilinsin"
 * deb hisoblaydi (`shouldRender=true`) — shu payt ichida CSS chiqish
 * animatsiyasi ishga tushadi, so'ng butunlay unmount bo'ladi.
 *
 * Bu FAQAT vizual/animatsion yordamchi — hech qanday mavjud state yoki
 * logikani o'zgartirmaydi, komponentlar hali ham xuddi avvalgidek
 * `showModal`/`editingNote` kabi propslar orqali boshqariladi.
 */
export function useDelayedUnmount(isVisible, delay = 200) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    let timer;
    if (isVisible) {
      setShouldRender(true);
    } else if (shouldRender) {
      timer = setTimeout(() => setShouldRender(false), delay);
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, delay]);

  return shouldRender;
}
