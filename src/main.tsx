import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import { AuthGate } from "./auth/AuthContext";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <AppProvider><App /></AppProvider>
    </AuthGate>
  </StrictMode>,
);
