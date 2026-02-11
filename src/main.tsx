import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPalette, getActivePalette } from "./lib/colorPalettes";

// Apply saved theme before render to prevent flash
applyPalette(getActivePalette());

createRoot(document.getElementById("root")!).render(<App />);
