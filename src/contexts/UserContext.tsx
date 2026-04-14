import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface UserData {
  id: string;
  username: string;
  trophies: number;
  streak: number;
  league: string;
  last_played: string | null;
  created_at: string;
}

interface ChestReward {
  tipo: string;
  valor: number;
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  savePrediction: (prediction: PredictionInput) => Promise<void>;
  checkChest: () => Promise<boolean>;
  openChest: () => Promise<ChestReward | null>;
}

interface PredictionInput {
  mode: string;
  asset: string;
  direction: string | null;
  price_initial: number;
  price_final: number;
  variation_real: number;
  result: boolean;
  trophies_delta: number;
}

const UserContext = createContext<UserContextValue | null>(null);

function calcLeague(trophies: number): string {
  if (trophies >= 6000) return "Lendária";
  if (trophies >= 3500) return "Diamante";
  if (trophies >= 1800) return "Platina";
  if (trophies >= 800) return "Ouro";
  if (trophies >= 300) return "Prata";
  return "Bronze";
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateUser = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", "Pedro")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser(data as UserData);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ username: "Pedro", trophies: 0, streak: 0, league: "Bronze" })
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(newUser as UserData);
      }
    } catch (err) {
      console.error("Supabase user fetch error:", err);
      // Fallback
      setUser({ id: "local", username: "Pedro", trophies: 847, streak: 5, league: "Ouro", last_played: null, created_at: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrCreateUser();
  }, [fetchOrCreateUser]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("username", "Pedro")
        .maybeSingle();
      if (data) setUser(data as UserData);
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  }, []);

  const savePrediction = useCallback(async (input: PredictionInput) => {
    if (!user || user.id === "local") return;

    try {
      await supabase.from("predictions").insert({
        user_id: user.id,
        mode: input.mode,
        asset: input.asset,
        direction: input.direction,
        price_initial: input.price_initial,
        price_final: input.price_final,
        variation_real: input.variation_real,
        result: input.result,
        trophies_delta: input.trophies_delta,
      });

      const newTrophies = Math.max(0, user.trophies + input.trophies_delta);
      const newStreak = input.result ? user.streak + 1 : 0;
      const newLeague = calcLeague(newTrophies);

      await supabase
        .from("users")
        .update({
          trophies: newTrophies,
          streak: newStreak,
          league: newLeague,
          last_played: new Date().toISOString().split("T")[0],
        })
        .eq("id", user.id);

      setUser((prev) =>
        prev ? { ...prev, trophies: newTrophies, streak: newStreak, league: newLeague } : prev
      );
    } catch (err) {
      console.error("Save prediction error:", err);
    }
  }, [user]);

  const checkChest = useCallback(async (): Promise<boolean> => {
    if (!user || user.id === "local") return true;
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("chests")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "daily")
        .gte("opened_at", hoje)
        .maybeSingle();
      return !data;
    } catch {
      return true;
    }
  }, [user]);

  const openChest = useCallback(async (): Promise<ChestReward | null> => {
    if (!user || user.id === "local") return null;
    const recompensas: ChestReward[] = [
      { tipo: "moedas", valor: 50 },
      { tipo: "moedas", valor: 100 },
      { tipo: "moedas", valor: 200 },
      { tipo: "escudo", valor: 1 },
      { tipo: "xp_boost", valor: 2 },
    ];
    const recompensa = recompensas[Math.floor(Math.random() * recompensas.length)];

    try {
      await supabase.from("chests").insert({
        user_id: user.id,
        type: "daily",
        reward_type: recompensa.tipo,
        reward_value: recompensa.valor,
      });

      if (recompensa.tipo === "moedas") {
        const newTrophies = user.trophies + recompensa.valor;
        await supabase.from("users").update({ trophies: newTrophies }).eq("id", user.id);
        setUser((prev) => prev ? { ...prev, trophies: newTrophies } : prev);
      }

      return recompensa;
    } catch (err) {
      console.error("Open chest error:", err);
      return null;
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, savePrediction, checkChest, openChest }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
