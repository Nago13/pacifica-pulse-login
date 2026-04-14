import { useState, useEffect, useCallback } from "react";
import { Package, Lock, Gift, Clock } from "lucide-react";
import chestOpenedImg from "@/assets/chest-opened.png";
import chestClosedImg from "@/assets/chest-closed.png";
import BottomNav from "@/components/BottomNav";
import { useUser, type BattleChest } from "@/contexts/UserContext";

const MODES = [
  { key: "classico", label: "Clássico" },
  { key: "batalha", label: "Batalha" },
  { key: "precisao", label: "Precisão" },
];

const cardBorder = "1px solid rgba(92,200,232,0.15)";

const Chests = () => {
  const { user, checkChest, openChest, getBattleChests, openBattleChest, refreshPendingChests } = useUser();
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [dailyCountdown, setDailyCountdown] = useState("");
  const [battleChests, setBattleChests] = useState<BattleChest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalReward, setModalReward] = useState<{ tipo: string; valor: number; label?: string } | null>(null);
  const [openingChest, setOpeningChest] = useState(false);
  const [animPhase, setAnimPhase] = useState<"closed" | "opening" | "reward">("closed");

  const loadData = useCallback(async () => {
    const [available, chests] = await Promise.all([
      checkChest(),
      getBattleChests(),
    ]);
    setDailyAvailable(available);
    setBattleChests(chests);
  }, [checkChest, getBattleChests]);

  useEffect(() => { loadData(); }, [loadData]);

  // Daily countdown
  useEffect(() => {
    if (dailyAvailable) { setDailyCountdown(""); return; }
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setDailyCountdown(`${h}h ${m}min`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [dailyAvailable]);

  const handleOpenDaily = async () => {
    if (openingChest) return;
    setOpeningChest(true);
    const reward = await openChest();
    if (reward) {
      setModalReward(reward);
      setAnimPhase("closed");
      setShowModal(true);
      setTimeout(() => setAnimPhase("opening"), 500);
      setTimeout(() => setAnimPhase("reward"), 800);
    }
    setDailyAvailable(false);
    setOpeningChest(false);
  };

  const handleOpenBattle = async (chest: BattleChest) => {
    if (openingChest || chest.opened_at) return;
    setOpeningChest(true);
    const reward = await openBattleChest(chest.id, chest.mode);
    if (reward) {
      setModalReward(reward);
      setAnimPhase("closed");
      setShowModal(true);
      setTimeout(() => setAnimPhase("opening"), 500);
      setTimeout(() => setAnimPhase("reward"), 800);
    }
    await loadData();
    setOpeningChest(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalReward(null);
    setAnimPhase("closed");
  };

  const getModeCounts = (mode: string) => {
    const modeChests = battleChests.filter(c => c.mode === mode);
    const opened = modeChests.filter(c => !!c.opened_at);
    const unopened = modeChests.filter(c => !c.opened_at);
    return { opened, unopened };
  };

  const rewardLabel = (r: { tipo: string; valor: number; label?: string }) => {
    if (r.label) return r.label;
    if (r.tipo === "moedas") return `+${r.valor} troféus!`;
    if (r.tipo === "trofeus") return `+${r.valor} troféus bônus!`;
    if (r.tipo === "escudo") return `${r.valor} escudo protetor!`;
    if (r.tipo === "xp_boost") return `${r.valor}× XP Boost!`;
    if (r.tipo === "raro") return "Drop raro!";
    return `${r.tipo}: ${r.valor}`;
  };

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5">
          <h1 className="text-foreground text-[22px] font-bold">Meus Baús</h1>

          {/* Daily Chest */}
          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: cardBorder }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-success/20 flex items-center justify-center">
                <Gift size={24} className="text-success" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-bold text-sm">Baú Diário</span>
                {dailyAvailable ? (
                  <p className="text-success text-xs font-medium">Disponível!</p>
                ) : (
                  <p className="text-ocean-muted text-xs flex items-center gap-1">
                    <Clock size={10} /> Abre em {dailyCountdown}
                  </p>
                )}
              </div>
              {dailyAvailable && (
                <button
                  onClick={handleOpenDaily}
                  disabled={openingChest}
                  className="px-4 py-2 rounded-[10px] bg-success text-ocean-dark font-bold text-sm transition-all hover:opacity-80"
                >
                  Abrir
                </button>
              )}
            </div>
          </div>

          {/* Battle Chests by Mode */}
          <div className="flex flex-col gap-4">
            {MODES.map(({ key, label }) => {
              const { opened, unopened } = getModeCounts(key);

              return (
                <div key={key} className="rounded-[16px] bg-card-surface p-4" style={{ border: cardBorder }}>
                  <span className="text-foreground font-bold text-sm mb-3 block">{label}</span>
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      // State 1: Already opened
                      if (i < opened.length) {
                        return (
                          <div
                            key={i}
                            className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-default overflow-hidden"
                            style={{ background: "#0A1929", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            <img src={chestOpenedImg} alt="Baú aberto" className="w-10 h-10 object-contain opacity-60" />
                          </div>
                        );
                      }
                      // State 2: Available to open
                      const unopenedIdx = i - opened.length;
                      if (unopenedIdx < unopened.length) {
                        const chest = unopened[unopenedIdx];
                        return (
                          <button
                            key={i}
                            onClick={() => handleOpenBattle(chest)}
                            disabled={openingChest}
                            className="w-11 h-11 rounded-[8px] flex items-center justify-center transition-all cursor-pointer hover:scale-105 hover:shadow-[0_0_8px_rgba(92,200,232,0.4)] active:scale-95 animate-pulse-glow overflow-hidden"
                            style={{ background: "#1A3A4E", border: "1.5px solid #5CC8E8" }}
                          >
                            <img src={chestClosedImg} alt="Baú disponível" className="w-10 h-10 object-contain" />
                          </button>
                        );
                      }
                      // State 3: Empty slot
                      return (
                        <div
                          key={i}
                          className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-default"
                          style={{ background: "#0A1929", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <Lock size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-ocean-muted text-[11px]">
                    {unopened.length > 0
                      ? `${unopened.length} disponível(is) · ${opened.length} aberto(s) hoje`
                      : opened.length > 0
                        ? "Todos os baús abertos — volte amanhã!"
                        : "Nenhum baú ainda — acerte previsões para ganhar!"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Chest Open Modal */}
      {showModal && modalReward && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={closeModal}>
          <div
            className="bg-card-surface rounded-[16px] p-6 w-full max-w-sm text-center animate-result-enter"
            style={{ border: "1px solid rgba(92,200,232,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 transition-transform duration-300 ${
              animPhase === "opening" ? "scale-[1.2]" : "scale-100"
            }`}>
              <Package size={48} className={animPhase === "reward" ? "text-warning" : "text-pacific"} />
            </div>

            {animPhase === "reward" ? (
              <div className="animate-fade-in">
                <h2 className="text-foreground text-xl font-bold mb-2">Recompensa!</h2>
                <p className="text-pacific text-lg font-bold mb-4">{rewardLabel(modalReward)}</p>
              </div>
            ) : (
              <h2 className="text-foreground text-xl font-bold mb-2">Abrindo baú...</h2>
            )}

            <button onClick={closeModal} className="w-full h-11 rounded-[12px] bg-pacific text-ocean-dark font-bold text-sm mt-2">
              Fechar
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Chests;
