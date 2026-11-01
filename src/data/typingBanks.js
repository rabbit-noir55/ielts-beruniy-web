/**
 * typingBanks.js — Monkeytype uslubidagi typing testi uchun matn to'plamlari.
 *
 * O'quvchi rejimni o'zi tanlaydi. `mixed` rejimi barchasini aralashtiradi.
 */

export const GENERAL_WORDS = [
  "the", "and", "for", "with", "that", "this", "from", "they", "have", "were",
  "will", "would", "there", "their", "which", "about", "these", "those", "after",
  "before", "because", "between", "during", "while", "through", "without",
  "people", "world", "school", "house", "family", "friend", "children",
  "teacher", "student", "question", "answer", "important", "different",
  "beautiful", "problem", "change", "believe", "understand", "remember",
  "travel", "country", "language", "morning", "evening", "together",
  "always", "never", "often", "sometimes", "usually", "really", "almost",
  "again", "already", "because", "could", "should", "might", "must",
  "another", "example", "experience", "opportunity", "everything",
  "anything", "nothing", "something", "knowledge", "learning", "practice",
  "improve", "develop", "achieve", "success", "future", "today", "tomorrow",
  "yesterday", "water", "weather", "window", "winter", "summer", "spring",
  "autumn", "garden", "market", "money", "happy", "sad", "tired", "hungry",
  "thirsty", "busy", "quiet", "loud", "clean", "dirty", "strong", "weak",
  "fast", "slow", "easy", "difficult", "interesting", "exciting", "boring",
  "wonderful", "terrible", "great", "good", "bad", "new", "old", "young",
  "large", "small", "high", "low", "long", "short", "early", "late",
];

export const IELTS_WORDS = [
  "advantage", "disadvantage", "consequence", "environment", "government",
  "education", "technology", "development", "population", "pollution",
  "climate", "economy", "employment", "unemployment", "infrastructure",
  "transportation", "urban", "rural", "global", "sustainable", "significant",
  "beneficial", "detrimental", "necessary", "essential", "crucial", "vital",
  "considerable", "numerous", "various", "diverse", "appropriate", "effective",
  "efficient", "adequate", "sufficient", "alternative", "potential", "previous",
  "contemporary", "traditional", "modern", "industrial", "commercial",
  "agricultural", "economic", "social", "cultural", "environmental",
  "education", "healthcare", "welfare", "society", "community", "individual",
  "generation", "household", "citizen", "consumer", "producer", "manufacturer",
  "supplier", "worker", "employer", "employee", "manager", "government",
  "authority", "policy", "regulation", "legislation", "standard", "criteria",
  "requirement", "objective", "solution", "approach", "method", "strategy",
  "process", "procedure", "measure", "survey", "research", "analysis",
  "investigation", "evidence", "statistics", "percentage", "proportion",
  "amount", "quantity", "trend", "increase", "decrease", "fluctuation",
  "improvement", "decline", "growth", "expansion", "reduction", "impact",
  "effect", "influence", "factor", "cause", "reason", "purpose", "aim",
  "goal", "outcome", "result", "conclusion", "opinion", "argument",
  "perspective", "viewpoint", "aspect", "issue", "concern", "debate",
];

export const PHRASAL_WORDS = [
  "carry out", "find out", "figure out", "come up with", "give up",
  "look up", "look after", "look forward to", "take part in", "take place",
  "take into account", "put off", "put up with", "run out of", "get along with",
  "get rid of", "set up", "set off", "bring up", "bring about",
  "point out", "work out", "turn out", "turn up", "turn down",
  "show up", "show off", "break down", "break up", "catch up",
  "check out", "check in", "come across", "come back", "come up",
  "count on", "deal with", "depend on", "drop out", "end up",
  "fall behind", "fit in", "go ahead", "go on", "go through",
  "grow up", "hold on", "keep on", "keep up", "lead to",
  "move on", "pass away", "pay back", "pick up", "pull off",
  "put on", "put out", "rely on", "result in", "settle down",
  "sign up", "slow down", "speak up", "stand for", "stand out",
  "stay up", "take off", "take over", "think over", "try on",
  "turn into", "watch out", "back up", "calm down", "cheer up",
  "cut down", "fill in", "give back", "hold back", "keep away",
  "make up", "make up for", "pay off", "take after", "throw away",
  "make a decision", "make a mistake", "make an effort", "make progress",
  "take responsibility", "take action", "play a role", "play a part",
  "have an impact", "have an effect", "raise awareness", "reach a goal",
  "achieve a goal", "meet a need", "meet a demand", "face a challenge",
  "overcome a challenge", "solve a problem", "address an issue",
  "gain experience", "gain knowledge", "acquire skills", "develop skills",
  "improve performance", "boost confidence", "enhance quality",
  "maintain balance", "strike a balance", "pay attention", "give attention",
  "draw attention", "set a target", "meet a deadline", "stay healthy",
  "keep fit", "save money", "earn money", "spend money", "waste money",
];

export const SENTENCES = [
  "Education plays a crucial role in shaping the future of a society.",
  "Many people believe that technology has changed the way we communicate.",
  "It is often said that health is more important than wealth.",
  "Governments should invest more money in public transport systems.",
  "There is no doubt that climate change is one of the biggest challenges of our time.",
  "Young people should be encouraged to take responsibility for their own learning.",
  "Some argue that advertising influences our choices far more than we realise.",
  "The rapid growth of cities has created a number of serious problems.",
  "In recent years, the number of people working from home has increased dramatically.",
  "It is the duty of parents to set a good example for their children.",
  "Exams are not the only way to measure a student's progress and ability.",
  "Access to clean drinking water remains a major issue in many developing countries.",
  "Technology has made it easier for people to stay in touch with friends abroad.",
  "A healthy diet combined with regular exercise is the key to a long life.",
  "Tourism can bring many benefits to a country, but it also has its drawbacks.",
  "The internet has revolutionised the way we access information and learn.",
  "Many students find it difficult to concentrate on their studies for long periods.",
  "It is generally accepted that early childhood education is very important.",
  "Some people believe that money is the main factor that determines happiness.",
  "The government should do more to encourage the use of renewable energy.",
  "Learning a foreign language opens up many new opportunities for students.",
  "In many countries, the cost of living has risen faster than salaries.",
  "Teamwork is an essential skill in both education and the workplace.",
  "The media has a powerful influence on public opinion and behaviour.",
  "Spending time outdoors is beneficial for both physical and mental health.",
];

export const MIXED_WORDS = [
  ...GENERAL_WORDS.slice(0, 60),
  ...IELTS_WORDS.slice(0, 60),
  ...PHRASAL_WORDS.slice(0, 50),
  ...SENTENCES.slice(0, 12),
];

export const WORD_BANKS = {
  general: GENERAL_WORDS,
  ielts: IELTS_WORDS,
  phrasal: PHRASAL_WORDS,
  sentences: SENTENCES,
  mixed: MIXED_WORDS,
};

export const MODE_OPTIONS = [
  { key: "general", label: "General words" },
  { key: "ielts", label: "IELTS vocabulary" },
  { key: "phrasal", label: "Phrasal verbs & collocations" },
  { key: "sentences", label: "IELTS sentences" },
  { key: "mixed", label: "Mixed" },
];

export const TIME_OPTIONS = [15, 30, 60, 120];
