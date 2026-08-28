import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CloudAppProvider } from "./context/CloudAppProvider";
import { AuthGate } from "./auth/AuthContext";
import { HouseholdGate } from "./households/HouseholdContext";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <HouseholdGate>
        <CloudAppProvider><App /></CloudAppProvider>
      </HouseholdGate>
    </AuthGate>
  </StrictMode>,
);
