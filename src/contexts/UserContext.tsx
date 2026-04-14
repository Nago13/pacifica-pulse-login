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
  label?: string;
}

export interface BattleChest {
  id: string;
  mode: string;
  earned_at: string;
  opened_at: string | null;
  reward_type: string | null;
  reward_value: number | null;
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  savePrediction: (prediction: PredictionInput) => Promise<void>;
  checkChest: () => Promise<boolean>;
  openChest: () => Promise<ChestReward | null>;
  earnBattleChest: (mode: string) => Promise<boolean>;
  getBattleChests: () => Promise<BattleChest[]>;
  openBattleChest: (chestId: string, mode: string) => Promise<ChestReward | null>;
  countBattleChestsToday: (mode: string) => Promise<number>;
  pendingBattleChestCount: number;
  refreshPendingChests: () => Promise<void>;
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

const BATTLE_REWARDS: Record<string, ChestReward[]> = {
  classico: [
    { tipo: "trofeus", valor: 10, label: "+10 troféus bônus" },
    { tipo: "trofeus", valor: 20, label: "+20 troféus bônus" },
    { tipo: "moedas", valor: 150, label: "150 moedas" },
    { tipo: "escudo", valor: 1, label: "Escudo de streak" },
    { tipo: "xp_boost", valor: 2, label: "Boost de XP 2×" },
  ],
  batalha: [
    { tipo: "trofeus", valor: 20, label: "+20 troféus bônus" },
    { tipo: "trofeus", valor: 40, label: "+40 troféus bônus" },
    { tipo: "moedas", valor: 300, label: "300 moedas" },
    { tipo: "escudo", valor: 2, label: "Escudo de streak ×2" },
    { tipo: "xp_boost", valor: 3, label: "Boost de XP 3×" },
  ],
  precisao: [
    { tipo: "trofeus", valor: 30, label: "+30 troféus bônus" },
    { tipo: "trofeus", valor: 60, label: "+60 troféus bônus" },
    { tipo: "moedas", valor: 500, label: "500 moedas" },
    { tipo: "escudo", valor: 3, label: "Escudo de streak ×3" },
    { tipo: "raro", valor: 1, label: "Drop raro!" },
  ],
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingBattleChestCount, setPendingBattleChestCount] = useState(0);

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

  // Daily chest
  const checkChest = useCallback(async (): Promise<boolean> => {
    if (!user || user.id === "local") return true;
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("chests")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "daily")
        .gte("earned_at", hoje)
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
        earned_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
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

  // Battle chests
  const countBattleChestsToday = useCallback(async (mode: string): Promise<number> => {
    if (!user || user.id === "local") return 0;
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("chests")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "battle")
        .eq("mode", mode)
        .gte("earned_at", hoje);
      return data?.length ?? 0;
    } catch {
      return 0;
    }
  }, [user]);

  const earnBattleChest = useCallback(async (mode: string): Promise<boolean> => {
    if (!user || user.id === "local") return false;
    try {
      const count = await countBattleChestsToday(mode);
      if (count >= 5) return false;

      await supabase.from("chests").insert({
        user_id: user.id,
        type: "battle",
        mode,
        earned_at: new Date().toISOString(),
        opened_at: null,
        reward_type: null,
        reward_value: null,
      });
      await refreshPendingChests();
      return true;
    } catch (err) {
      console.error("Earn battle chest error:", err);
      return false;
    }
  }, [user]);

  const getBattleChests = useCallback(async (): Promise<BattleChest[]> => {
    if (!user || user.id === "local") return [];
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("chests")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "battle")
        .gte("earned_at", hoje)
        .order("earned_at", { ascending: true });
      return (data ?? []) as BattleChest[];
    } catch {
      return [];
    }
  }, [user]);

  const openBattleChest = useCallback(async (chestId: string, mode: string): Promise<ChestReward | null> => {
    if (!user || user.id === "local") return null;
    const rewards = BATTLE_REWARDS[mode] ?? BATTLE_REWARDS.classico;
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    try {
      await supabase.from("chests").update({
        opened_at: new Date().toISOString(),
        reward_type: reward.tipo,
        reward_value: reward.valor,
      }).eq("id", chestId);

      if (reward.tipo === "trofeus") {
        const newTrophies = user.trophies + reward.valor;
        await supabase.from("users").update({ trophies: newTrophies }).eq("id", user.id);
        setUser((prev) => prev ? { ...prev, trophies: newTrophies } : prev);
      }

      await refreshPendingChests();
      return reward;
    } catch (err) {
      console.error("Open battle chest error:", err);
      return null;
    }
  }, [user]);

  const refreshPendingChests = useCallback(async () => {
    if (!user || user.id === "local") { setPendingBattleChestCount(0); return; }
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("chests")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "battle")
        .is("opened_at", null)
        .gte("earned_at", hoje);
      setPendingBattleChestCount(data?.length ?? 0);
    } catch {
      setPendingBattleChestCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id !== "local") refreshPendingChests();
  }, [user, refreshPendingChests]);

  return (
    <UserContext.Provider value={{
      user, loading, refreshUser, savePrediction,
      checkChest, openChest,
      earnBattleChest, getBattleChests, openBattleChest, countBattleChestsToday,
      pendingBattleChestCount, refreshPendingChests,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
