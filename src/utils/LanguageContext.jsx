import { createContext, useContext } from "react";

const LanguageContext = createContext();

// For simplicity, default to English; remove language switching functionality
const DEFAULT_LANG = "en";

export function LanguageProvider({ children }) {
  const lang = DEFAULT_LANG;

  return (
    <LanguageContext.Provider value={{ lang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LanguageContext);
}
