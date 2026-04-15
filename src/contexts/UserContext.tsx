import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { fetchPacificaPrices } from "@/lib/pacificaApi";

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

export interface ActivePrediction {
  mode: string;
  asset: string;
  direction: string;
  priceInitial: number;
  startedAt: number;
  durationSeconds: number;
  // Battle-specific
  assetsArena?: string[];
  pricesInitial?: Record<string, number>;
  // Precision-specific (direction holds the range like "0.5-2")
  precisionReward?: number;
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
  activePrediction: ActivePrediction | null;
  setActivePrediction: (p: ActivePrediction | null) => void;
  timeRemaining: number;
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

const PRECISION_REWARDS: Record<string, { win: number; loss: number }> = {
  "0-0.1": { win: 10, loss: -15 },
  "0.1-0.5": { win: 25, loss: -15 },
  "0.5-2": { win: 60, loss: -15 },
  "2+": { win: 150, loss: -15 },
};

const PRECISION_RANGE_BOUNDS: Record<string, [number, number]> = {
  "0-0.1": [0, 0.1],
  "0.1-0.5": [0.1, 0.5],
  "0.5-2": [0.5, 2],
  "2+": [2, Infinity],
};

const COIN_ID_MAP: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
};

const ACTIVE_PREDICTION_KEY = "activePrediction";

export function UserProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingBattleChestCount, setPendingBattleChestCount] = useState(0);

  const [activePrediction, setActivePredictionState] = useState<ActivePrediction | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolvingRef = useRef(false);
  const earnBattleChestRef = useRef<(mode: string) => Promise<boolean>>(async () => false);

  const setActivePrediction = useCallback((p: ActivePrediction | null) => {
    setActivePredictionState(p);
    if (p) {
      localStorage.setItem(ACTIVE_PREDICTION_KEY, JSON.stringify(p));
      const elapsed = (Date.now() - p.startedAt) / 1000;
      setTimeRemaining(Math.max(0, Math.floor(p.durationSeconds - elapsed)));
    } else {
      localStorage.removeItem(ACTIVE_PREDICTION_KEY);
      setTimeRemaining(0);
    }
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_PREDICTION_KEY);
    if (saved) {
      try {
        const prediction: ActivePrediction = JSON.parse(saved);
        const elapsed = (Date.now() - prediction.startedAt) / 1000;
        const remaining = prediction.durationSeconds - elapsed;
        if (remaining > 0) {
          setActivePredictionState(prediction);
          setTimeRemaining(Math.floor(remaining));
        } else {
          localStorage.removeItem(ACTIVE_PREDICTION_KEY);
        }
      } catch {
        localStorage.removeItem(ACTIVE_PREDICTION_KEY);
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!activePrediction) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activePrediction]);

  // Auto-resolve when timer hits 0
  useEffect(() => {
    if (timeRemaining !== 0 || !activePrediction || resolvingRef.current) return;
    resolvingRef.current = true;

    const resolve = async () => {
      try {
        const mode = activePrediction.mode;

        if (mode === "classico") {
          await resolveClassic();
        } else if (mode === "batalha") {
          await resolveBattle();
        } else if (mode === "precisao") {
          await resolvePrecision();
        }
      } catch (err) {
        console.error("Auto-resolve prediction error:", err);
        setActivePredictionState(null);
        localStorage.removeItem(ACTIVE_PREDICTION_KEY);
      } finally {
        resolvingRef.current = false;
      }
    };

    const resolveClassic = async () => {
      const pacifica = await fetchPacificaPrices();
      if (!pacifica?.bitcoin) throw new Error("Pacifica unavailable");
      const precoFinal = pacifica.bitcoin.mark;
      const variacao = ((precoFinal - activePrediction!.priceInitial) / activePrediction!.priceInitial) * 100;
      const acertou = activePrediction!.direction === "up" ? variacao > 0 : variacao < 0;
      const trofeusGanhos = acertou ? 25 : -15;

      await saveAndNavigate({
        mode: "classico",
        asset: activePrediction!.asset,
        direction: activePrediction!.direction,
        priceFinal: precoFinal,
        variacao: Math.abs(variacao),
        acertou,
        trofeusGanhos,
        navState: {
          acertou,
          variacao: Math.abs(variacao).toFixed(2),
          ativo: activePrediction!.asset,
          direcao: activePrediction!.direction,
          precoInicial: activePrediction!.priceInitial,
          precoFinal,
          streak: user?.streak ?? 0,
        },
      });
    };

    const resolveBattle = async () => {
      const pacifica = await fetchPacificaPrices();
      if (!pacifica) throw new Error("Pacifica unavailable");
      const arenaIds = activePrediction!.assetsArena ?? [];
      const pricesInitial = activePrediction!.pricesInitial ?? {};

      const PACIFICA_MAP: Record<string, keyof typeof pacifica> = {
        bitcoin: "bitcoin", ethereum: "ethereum", solana: "solana",
      };

      const arenaVariations: Record<string, number> = {};
      for (const coinId of arenaIds) {
        const ticker = COIN_ID_MAP[coinId] ?? coinId.toUpperCase();
        const startPrice = pricesInitial[ticker] ?? 0;
        const asset = pacifica[PACIFICA_MAP[coinId]];
        const endPrice = asset?.mark ?? startPrice;
        arenaVariations[ticker] = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
      }

      const moedaVencedora = Object.entries(arenaVariations).sort((a, b) => b[1] - a[1])[0][0];
      const chosenTicker = activePrediction!.direction;
      const acertou = chosenTicker === moedaVencedora;
      const trofeusGanhos = acertou ? 40 : -15;

      const navState: Record<string, unknown> = {
        modo: "batalha",
        moedaEscolhida: chosenTicker,
        moedaVencedora,
        acertou,
        arenaCoins: Object.keys(arenaVariations),
        streak: user?.streak ?? 0,
      };
      for (const [ticker, val] of Object.entries(arenaVariations)) {
        navState[`variacao${ticker}`] = (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
      }

      await saveAndNavigate({
        mode: "batalha",
        asset: activePrediction!.asset,
        direction: activePrediction!.direction,
        priceFinal: 0,
        variacao: 0,
        acertou,
        trofeusGanhos,
        navState,
      });
    };

    const resolvePrecision = async () => {
      const pacifica = await fetchPacificaPrices();
      if (!pacifica?.bitcoin) throw new Error("Pacifica unavailable");
      const precoFinal = pacifica.bitcoin.mark;
      const variacaoAbs = Math.abs(((precoFinal - activePrediction!.priceInitial) / activePrediction!.priceInitial) * 100);
      const faixaEscolhida = activePrediction!.direction;

      const bounds = PRECISION_RANGE_BOUNDS[faixaEscolhida];
      const acertou = bounds ? variacaoAbs >= bounds[0] && variacaoAbs < bounds[1] : false;

      let faixaReal = "";
      for (const [key, [lo, hi]] of Object.entries(PRECISION_RANGE_BOUNDS)) {
        if (variacaoAbs >= lo && variacaoAbs < hi) { faixaReal = key; break; }
      }

      const rewardInfo = PRECISION_REWARDS[faixaEscolhida] ?? { win: 10, loss: -15 };
      const trofeusGanhos = acertou ? rewardInfo.win : rewardInfo.loss;

      await saveAndNavigate({
        mode: "precisao",
        asset: "BTC",
        direction: faixaEscolhida,
        priceFinal: precoFinal,
        variacao: variacaoAbs,
        acertou,
        trofeusGanhos,
        navState: {
          modo: "precisao",
          faixaEscolhida,
          faixaReal,
          variacaoReal: variacaoAbs.toFixed(2),
          acertou,
          retorno: activePrediction!.precisionReward ?? rewardInfo.win,
          precoInicial: activePrediction!.priceInitial,
          precoFinal,
          streak: user?.streak ?? 0,
        },
      });
    };

    const saveAndNavigate = async ({
      mode, asset, direction, priceFinal, variacao, acertou, trofeusGanhos, navState,
    }: {
      mode: string; asset: string; direction: string; priceFinal: number;
      variacao: number; acertou: boolean; trofeusGanhos: number; navState: Record<string, unknown>;
    }) => {
      if (user && user.id !== "local") {
        console.log('Salvando previsão:', { mode, asset, direction, acertou, trofeusGanhos });
        await supabase.from("predictions").insert({
          user_id: user.id,
          mode,
          asset,
          direction,
          price_initial: activePrediction!.priceInitial,
          price_final: priceFinal,
          variation_real: variacao,
          result: acertou,
          trophies_delta: trofeusGanhos,
        });

        const newTrophies = Math.max(0, user.trophies + trofeusGanhos);
        const newStreak = acertou ? user.streak + 1 : 0;
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

        // Earn a battle chest on correct prediction
        if (acertou) {
          console.log('Salvando baú com mode:', mode);
          const earned = await earnBattleChestRef.current(mode);
          console.log('Baú ganho:', earned);
        }
      }

      setActivePredictionState(null);
      localStorage.removeItem(ACTIVE_PREDICTION_KEY);

      navigate("/result", { state: navState });
    };

    resolve();
  }, [timeRemaining, activePrediction, user, navigate]);

  // ── User fetch/create ──
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
  }, [user, countBattleChestsToday, refreshPendingChests]);

  earnBattleChestRef.current = earnBattleChest;

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
  }, [user, refreshPendingChests]);

  useEffect(() => {
    if (user && user.id !== "local") refreshPendingChests();
  }, [user, refreshPendingChests]);

  return (
    <UserContext.Provider value={{
      user, loading, refreshUser, savePrediction,
      checkChest, openChest,
      earnBattleChest, getBattleChests, openBattleChest, countBattleChestsToday,
      pendingBattleChestCount, refreshPendingChests,
      activePrediction, setActivePrediction, timeRemaining,
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
