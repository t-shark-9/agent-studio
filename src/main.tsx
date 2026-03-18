import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force fresh asset hash on deploy to avoid stale CDN metadata.
createRoot(document.getElementById("root")!).render(<App />);
