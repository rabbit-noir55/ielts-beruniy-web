import {
  faArrowDown,
  faBolt,
  faBrain,
  faBullseye,
  faCrosshairs,
  faFont,
  faGamepad,
  faKeyboard,
  faLayerGroup,
  faLink,
  faMagnifyingGlass,
  faShuffle,
  faSkull,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Saytning o'z o'yinlari — canvas/React dvigatelida, sprite va ovoz bilan.
 * Ustoz qo'shgan HTML o'yinlar bundan alohida ishlayveradi.
 */
export const BUILTIN_GAMES = [
  {
    key: "word-shooter",
    title: "Word Shooter",
    desc: "Tarjimaga mos inglizcha so'zni otib tushiring — kosmik jang, combo va zarralar.",
    icon: faCrosshairs,
  },
  {
    key: "falling-words",
    title: "Falling Words",
    desc: "Tushayotgan so'zlarni yozib ulguring. Ketma-ket to'g'ri javob — bonus.",
    icon: faArrowDown,
  },
  {
    key: "word-snake",
    title: "Word Snake",
    desc: "Ilon bilan maqsad so'zning harflarini tartib bilan yeb chiqing.",
    icon: faGamepad,
  },
  {
    key: "bubble-pop",
    title: "Bubble Pop",
    desc: "60 soniyada tarjimaga mos pufakchani topib yoping.",
    icon: faBullseye,
  },
  {
    key: "memory-match",
    title: "Memory Match",
    desc: "So'z va tarjima juftliklarini yodda saqlab toping — vaqt va harakat hisoblanadi.",
    icon: faBrain,
  },
  {
    key: "spell-rush",
    title: "Spell Rush",
    desc: "Ma'nosi va talaffuzi berilgan so'zning yozilishini kiriting.",
    icon: faVolumeHigh,
  },
  {
    key: "word-scramble",
    title: "Word Scramble",
    desc: "Aralashtirilgan harflardan to'g'ri inglizcha so'zni tuzing.",
    icon: faShuffle,
  },
  {
    key: "quiz-rush",
    title: "Quiz Rush",
    desc: "60 soniyada imkon qadar ko'p tarjimani toping — tezlik va combo.",
    icon: faBolt,
  },
  {
    key: "word-chain",
    title: "Word Chain",
    desc: "Oxirgi harfdan boshlanuvchi yangi so'z bilan zanjirni davom ettiring.",
    icon: faLink,
  },
  {
    key: "hangman",
    title: "Hangman",
    desc: "Tarjima yordamida yashiringan so'zni harflab toping — 6 urinish.",
    icon: faSkull,
  },
  {
    key: "missing-letter",
    title: "Missing Letter",
    desc: "So'zdagi tushib qolgan harfni tez toping.",
    icon: faFont,
  },
  {
    key: "typing-race",
    title: "Typing Race",
    desc: "So'zlarni imkon qadar tez yozing — WPM va aniqlik.",
    icon: faKeyboard,
  },
  {
    key: "word-ladder",
    title: "Word Ladder",
    desc: "Har safar bitta harfni o'zgartirib, so'z zanjirini uzaytiring.",
    icon: faLayerGroup,
  },
  {
    key: "word-search",
    title: "Word Search",
    desc: "Kataklar orasiga yashiringan 5 ta so'zni toping.",
    icon: faMagnifyingGlass,
  },
];

export function gameMeta(key) {
  return BUILTIN_GAMES.find((game) => game.key === key) || null;
}
