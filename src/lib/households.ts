import { supabase } from "./supabase";

export type Household = { id: string; name: string; role: "owner" | "member" };

export async function listHouseholds(): Promise<Household[]> {
  const { data, error } = await supabase!.from("household_members").select("role, households(id,name)");
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const household = Array.isArray(row.households) ? row.households[0] : row.households;
    return household ? [{ id: household.id, name: household.name, role: row.role as Household["role"] }] : [];
  });
}

export async function createHousehold(name: string) {
  const { data, error } = await supabase!.rpc("create_household", { household_name: name.trim() });
  if (error) throw error;
  return data as string;
}

export async function joinHousehold(code: string) {
  const { data, error } = await supabase!.rpc("join_household", { invite_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data as string;
}

export async function createInvite(householdId: string) {
  const { data, error } = await supabase!.rpc("create_household_invite", { target_household_id: householdId });
  if (error) throw error;
  return data as string;
}

export async function renameHousehold(householdId: string, name: string) {
  const nextName = name.trim();
  if (!nextName) throw new Error("家庭名称不能为空");
  const { error } = await supabase!
    .from("households")
    .update({ name: nextName, updated_at: new Date().toISOString() })
    .eq("id", householdId);
  if (error) throw error;
}