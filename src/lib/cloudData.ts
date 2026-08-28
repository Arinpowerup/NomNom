import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AppData } from "../types";
import { supabase } from "./supabase";

export async function loadCloudData(householdId: string): Promise<AppData | null> {
  const { data, error } = await supabase!.from("household_states").select("data").eq("household_id", householdId).maybeSingle();
  if (error) throw error;
  return (data?.data as AppData | undefined) ?? null;
}

export async function saveCloudData(householdId: string, userId: string, data: AppData) {
  const { error } = await supabase!.from("household_states").upsert({ household_id: householdId, data, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "household_id" });
  if (error) throw error;
}

export function subscribeCloudData(householdId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase!.channel(`household-state-${householdId}`).on("postgres_changes", { event: "*", schema: "public", table: "household_states", filter: `household_id=eq.${householdId}` }, onChange).subscribe();
  return () => { void supabase!.removeChannel(channel); };
}
