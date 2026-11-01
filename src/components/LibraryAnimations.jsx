
const LibraryAnimations = () => (
  <style>{`
    /* ── Shimmer (skeleton loading) ── */
    @keyframes lib-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* ── 1. Clip-mask reveal (cinematic) ── */
    @keyframes lib-reveal-up {
      0% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateY(20px); }
      100% { opacity: 1; clip-path: inset(0 0 0 0); transform: translateY(0); }
    }

    /* ── 2. 3D Book open ── */
    @keyframes lib-book-open {
      0% { opacity: 0; transform: perspective(800px) rotateY(-40deg) translateX(-30px) scale(0.9); transform-origin: left center; }
      60% { opacity: 1; transform: perspective(800px) rotateY(4deg) translateX(4px) scale(1.01); }
      100% { opacity: 1; transform: perspective(800px) rotateY(0) translateX(0) scale(1); }
    }

    /* ── 3. Blur fade-in ── */
    @keyframes lib-blur-in {
      0% { opacity: 0; filter: blur(12px); transform: translateY(16px) scale(0.97); }
      100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
    }

    /* ── 4. Elastic spring ── */
    @keyframes lib-spring {
      0% { opacity: 0; transform: scale(0.3) translateY(40px); }
      50% { opacity: 1; transform: scale(1.08) translateY(-6px); }
      70% { transform: scale(0.96) translateY(2px); }
      85% { transform: scale(1.02) translateY(-1px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── 5. Cascade waterfall (3D tilt) ── */
    @keyframes lib-cascade {
      0% { opacity: 0; transform: perspective(600px) rotateX(12deg) translateY(50px) scale(0.92); }
      100% { opacity: 1; transform: perspective(600px) rotateX(0) translateY(0) scale(1); }
    }

    /* ── 6. Drop from sky with bounce ── */
    @keyframes lib-drop {
      0% { opacity: 0; transform: translateY(-60px) scale(0.9); }
      45% { opacity: 1; transform: translateY(8px) scale(1.02); }
      65% { transform: translateY(-3px) scale(0.99); }
      80% { transform: translateY(1px) scale(1.005); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── 7. 3D rotate in ── */
    @keyframes lib-rotate-in {
      0% { opacity: 0; transform: perspective(600px) rotateY(25deg) translateZ(-80px) scale(0.85); }
      100% { opacity: 1; transform: perspective(600px) rotateY(0) translateZ(0) scale(1); }
    }

    /* ── 8. Magnetic pull ── */
    @keyframes lib-magnetic {
      0% { opacity: 0; transform: translateX(-40px) translateY(20px) rotate(-2deg); }
      60% { opacity: 1; transform: translateX(6px) translateY(-3px) rotate(0.5deg); }
      100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0); }
    }

    /* ── 9. Scale-pop ── */
    @keyframes lib-pop {
      0% { opacity: 0; transform: scale(0); }
      60% { opacity: 1; transform: scale(1.12); }
      80% { transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* ── 10. Slide + rotate ── */
    @keyframes lib-slide-rotate {
      0% { opacity: 0; transform: translateX(40px) translateY(20px) rotate(4deg); }
      100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0); }
    }

    /* ── 11. Text mask wipe ── */
    @keyframes lib-wipe {
      0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
      100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
    }

    /* ── 12. Float up ── */
    @keyframes lib-float {
      0% { opacity: 0; transform: translateY(30px) scale(0.95); }
      50% { transform: translateY(-4px) scale(1.01); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── 13. Mobile: smooth slide-up ── */
    @keyframes app-smooth-in {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    /* ── Legacy fly animations (other pages) ── */
    @keyframes lib-fly-up {
      0% { opacity: 0; transform: translateY(40px) rotateX(8deg); }
      100% { opacity: 1; transform: translateY(0) rotateX(0); }
    }
    @keyframes lib-fly-down {
      0% { opacity: 0; transform: translateY(-30px) rotateX(-6deg); }
      100% { opacity: 1; transform: translateY(0) rotateX(0); }
    }
    @keyframes lib-fly-left {
      0% { opacity: 0; transform: translateX(30px) rotateY(-6deg); }
      100% { opacity: 1; transform: translateX(0) rotateY(0); }
    }
    @keyframes lib-fly-right {
      0% { opacity: 0; transform: translateX(-30px) rotateY(6deg); }
      100% { opacity: 1; transform: translateX(0) rotateY(0); }
    }
    @keyframes lib-fly-scale {
      0% { opacity: 0; transform: scale(0.85) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes lib-fly-tilt {
      0% { opacity: 0; transform: translateY(30px) rotate(-3deg) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
    }

    /* ── 3D scene container with camera move ── */
    .scene-3d {
      perspective: 1200px;
      perspective-origin: 50% 50%;
      animation: lib-camera-move 6s ease-in-out infinite alternate;
    }
    @media (max-width: 639px) {
      .scene-3d {
        perspective: none;
        animation: none;
      }
    }

    @keyframes lib-camera-move {
      0%   { perspective-origin: 44% 47%; }
      20%  { perspective-origin: 53% 45%; }
      40%  { perspective-origin: 47% 53%; }
      60%  { perspective-origin: 55% 48%; }
      80%  { perspective-origin: 46% 52%; }
      100% { perspective-origin: 50% 50%; }
    }

    /* ── Depth layers for parallax ── */
    .lib-depth-1 { transform: translateZ(10px); }
    .lib-depth-2 { transform: translateZ(20px); }
    .lib-depth-3 { transform: translateZ(30px); }

    /* ── Skeleton shimmer ── */
    .lib-skeleton {
      background: linear-gradient(90deg, rgba(148,163,184,0.15) 25%, rgba(148,163,184,0.35) 37%, rgba(148,163,184,0.15) 63%);
      background-size: 400% 100%;
      animation: lib-shimmer 1.4s ease-in-out infinite;
      border-radius: 0.5rem;
    }
    .dark .lib-skeleton {
      background: linear-gradient(90deg, rgba(51,65,85,0.4) 25%, rgba(71,85,105,0.6) 37%, rgba(51,65,85,0.4) 63%);
      background-size: 400% 100%;
    }

    /* ── Animation classes ── */
    .lib-reveal-up   { animation: lib-reveal-up   0.6s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-book-open   { animation: lib-book-open   0.65s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-blur-in     { animation: lib-blur-in     0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-spring      { animation: lib-spring      0.7s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-cascade     { animation: lib-cascade     0.6s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-drop        { animation: lib-drop        0.65s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-rotate-in   { animation: lib-rotate-in   0.6s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-magnetic    { animation: lib-magnetic    0.6s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-pop         { animation: lib-pop         0.5s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-slide-rotate{ animation: lib-slide-rotate 0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-wipe        { animation: lib-wipe        0.6s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-float       { animation: lib-float       0.6s  cubic-bezier(0.16,1,0.3,1) both; }
    .app-smooth-in   { animation: app-smooth-in   0.45s cubic-bezier(0.22,1,0.36,1) both; }

    /* ── Legacy classes ── */
    .lib-fly-up   { animation: lib-fly-up   0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-fly-down { animation: lib-fly-down 0.4s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-fly-left { animation: lib-fly-left 0.4s  cubic-bezier(0.16,1,0.3,1) both; }
    .lib-fly-right{ animation: lib-fly-right 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-fly-scale{ animation: lib-fly-scale 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .lib-fly-tilt { animation: lib-fly-tilt 0.45s cubic-bezier(0.16,1,0.3,1) both; }

    @media (prefers-reduced-motion: reduce) {
      .lib-skeleton, .lib-reveal-up, .lib-book-open, .lib-blur-in,
      .lib-spring, .lib-cascade, .lib-drop, .lib-rotate-in,
      .lib-magnetic, .lib-pop, .lib-slide-rotate, .lib-wipe, .lib-float,
      .app-smooth-in,
      .lib-fly-up, .lib-fly-down, .lib-fly-left, .lib-fly-right,
      .lib-fly-scale, .lib-fly-tilt {
        animation: none !important;
      }
    }

    /* ── Mobile: 3D animatsiyalarni smooth slide bilan almashtirish ── */
    @media (max-width: 639px) {
      .lib-book-open {
        animation: app-smooth-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
      }
      .lib-cascade {
        animation: app-smooth-in 0.45s cubic-bezier(0.22,1,0.36,1) both;
      }
      .lib-magnetic {
        animation: none !important;
      }
      .lib-wipe {
        animation: none !important;
      }
    }
  `}</style>
);

export default LibraryAnimations;
