import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import { AuthGate } from "./auth/AuthContext";
import { HouseholdGate } from "./households/HouseholdContext";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <HouseholdGate>
        <AppProvider><App /></AppProvider>
      </HouseholdGate>
    </AuthGate>
  </StrictMode>,
);
