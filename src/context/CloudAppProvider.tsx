import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { useHousehold } from "../households/HouseholdContext";
import { AppProvider } from "./AppContext";

export function CloudAppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { household } = useHousehold();
  return <AppProvider householdId={household.id} userId={user.id}>{children}</AppProvider>;
}
