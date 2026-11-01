import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { isTelegram, tg } from "./utils/telegram.js";

if (isTelegram()) {
  tg()?.ready?.();
  tg()?.expand?.();
  tg()?.setHeaderColor?.("secondary_bg_color");
  tg()?.disableVerticalSwipes?.();
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
