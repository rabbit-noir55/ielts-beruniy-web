
/**
 * YANGI: Butun Listening sahifasi uchun umumiy CSS animatsiya/keyframe'lar
 * bitta joyda. Sahifaning barcha "early return" holatlarida (loading,
 * xatolik, asosiy UI) chaqiriladi, shunda hech qaysi holatda animatsiyalar
 * yo'qolib qolmaydi. Faqat CSS — hech qanday mavjud state yoki logikaga
 * ta'sir qilmaydi.
 */
const ListeningAnimations = () => (
  <style>{`
    @keyframes qz-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes qz-fade-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes qz-scale-in {
      from { opacity: 0; transform: scale(0.94) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes qz-scale-out {
      from { opacity: 1; transform: scale(1) translateY(0); }
      to   { opacity: 0; transform: scale(0.94) translateY(6px); }
    }
    @keyframes qz-pop-in {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes qz-pop-out {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.9); }
    }
    @keyframes qz-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes qz-spin-smooth {
      to { transform: rotate(360deg); }
    }

    /* Modal / popup kirish-chiqish animatsiyalari */
    .qz-anim-fade-in  { animation: qz-fade-in .18s ease-out both; }
    .qz-anim-fade-out { animation: qz-fade-out .18s ease-in both; }
    .qz-anim-scale-in  { animation: qz-scale-in .22s cubic-bezier(0.16,1,0.3,1) both; }
    .qz-anim-scale-out { animation: qz-scale-out .16s ease-in both; }
    .qz-anim-pop-in  { animation: qz-pop-in .16s cubic-bezier(0.16,1,0.3,1) both; }
    .qz-anim-pop-out { animation: qz-pop-out .13s ease-in both; }

    /* Skeleton loading */
    .qz-skeleton {
      background: linear-gradient(90deg, rgba(148,163,184,0.15) 25%, rgba(148,163,184,0.35) 37%, rgba(148,163,184,0.15) 63%);
      background-size: 400% 100%;
      animation: qz-shimmer 1.4s ease-in-out infinite;
      border-radius: 0.5rem;
    }
    .dark .qz-skeleton {
      background: linear-gradient(90deg, rgba(51,65,85,0.4) 25%, rgba(71,85,105,0.6) 37%, rgba(51,65,85,0.4) 63%);
      background-size: 400% 100%;
    }
    .qz-spinner {
      animation: qz-spin-smooth .7s linear infinite;
    }

    /* Umumiy tugma bosilish/hover silliqligi — ranglarga tegmaydi, faqat harakat */
    .qz-btn {
      transition: transform .12s ease, box-shadow .12s ease, background-color .15s ease,
        color .15s ease, border-color .15s ease, opacity .15s ease;
    }
    .qz-btn:hover:not(:disabled) { transform: translateY(-1px) scale(1.03); }
    .qz-btn:active:not(:disabled) { transform: translateY(0) scale(0.96); }
    .qz-btn:disabled { cursor: not-allowed; }

    .qz-icon-btn { transition: transform .15s ease, background-color .15s ease, color .15s ease; }
    .qz-icon-btn:hover:not(:disabled) { transform: scale(1.12); }
    .qz-icon-btn:active:not(:disabled) { transform: scale(0.92); }

    .qz-row-in { animation: qz-fade-in .3s ease-out both; }

    @media (prefers-reduced-motion: reduce) {
      .qz-anim-fade-in, .qz-anim-fade-out, .qz-anim-scale-in, .qz-anim-scale-out,
      .qz-anim-pop-in, .qz-anim-pop-out, .qz-skeleton, .qz-spinner, .qz-row-in {
        animation: none !important;
      }
      .qz-btn, .qz-icon-btn { transition: none !important; }
    }
  `}</style>
);

export default ListeningAnimations;
