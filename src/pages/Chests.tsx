import { useState, useEffect, useCallback } from "react";
import { Package, Lock, Gift, Clock } from "lucide-react";
import chestOpenedImg from "@/assets/chest-opened.png";
import oceanTreasureBg from "@/assets/ocean-treasure-bg.png";
import chestClosedImg from "@/assets/chest-closed.png";
import BottomNav from "@/components/BottomNav";
import { useUser, type BattleChest } from "@/contexts/UserContext";

const MODES = [
  { key: "classico", label: "Classic" },
  { key: "batalha", label: "Battle" },
  { key: "precisao", label: "Precision" },
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

  const MODE_ALIASES: Record<string, string[]> = {
    classico: ["classico", "Clássico", "classic", "classsico"],
    batalha: ["batalha", "Batalha", "battle"],
    precisao: ["precisao", "Precisão", "precision"],
  };

  const getModeCounts = (mode: string) => {
    const aliases = MODE_ALIASES[mode] ?? [mode];
    const modeChests = battleChests.filter(c => aliases.includes(c.mode));
    const opened = modeChests.filter(c => !!c.opened_at);
    const unopened = modeChests.filter(c => !c.opened_at);
    return { opened, unopened };
  };

  const rewardLabel = (r: { tipo: string; valor: number; label?: string }) => {
    if (r.label) return r.label;
    if (r.tipo === "moedas") return `+${r.valor} trophies!`;
    if (r.tipo === "trofeus") return `+${r.valor} bonus trophies!`;
    if (r.tipo === "escudo") return `${r.valor} streak shield!`;
    if (r.tipo === "xp_boost") return `${r.valor}× XP Boost!`;
    if (r.tipo === "raro") return "Rare drop!";
    return `${r.tipo}: ${r.valor}`;
  };

  return (
    <div className="min-h-screen font-dm-sans flex flex-col relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${oceanTreasureBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 z-0 bg-ocean-dark/40" />
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 relative z-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5">
          <h1 className="text-foreground text-[22px] font-bold">My Chests</h1>

          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: cardBorder }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-success/20 flex items-center justify-center">
                <Gift size={24} className="text-success" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-bold text-sm">Daily Chest</span>
                {dailyAvailable ? (
                  <p className="text-success text-xs font-medium">Available!</p>
                ) : (
                  <p className="text-ocean-muted text-xs flex items-center gap-1">
                    <Clock size={10} /> Opens in {dailyCountdown}
                  </p>
                )}
              </div>
              {dailyAvailable && (
                <button
                  onClick={handleOpenDaily}
                  disabled={openingChest}
                  className="px-4 py-2 rounded-[10px] bg-success text-ocean-dark font-bold text-sm transition-all hover:opacity-80"
                >
                  Open
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {MODES.map(({ key, label }) => {
              const { opened, unopened } = getModeCounts(key);

              return (
                <div key={key} className="rounded-[16px] bg-card-surface p-4" style={{ border: cardBorder }}>
                  <span className="text-foreground font-bold text-sm mb-3 block">{label}</span>
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      if (i < opened.length) {
                        return (
                          <div
                            key={i}
                            className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-default overflow-hidden"
                            style={{ background: "#0A1929", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            <img src={chestOpenedImg} alt="Opened chest" className="w-10 h-10 object-contain opacity-60" />
                          </div>
                        );
                      }
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
                            <img src={chestClosedImg} alt="Available chest" className="w-10 h-10 object-contain" />
                          </button>
                        );
                      }
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
                      ? `${unopened.length} available to open · ${opened.length} opened today`
                      : opened.length > 0
                        ? "All chests opened — come back tomorrow!"
                        : "No chests yet — hit predictions to earn some!"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

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
                <h2 className="text-foreground text-xl font-bold mb-2">Reward!</h2>
                <p className="text-pacific text-lg font-bold mb-4">{rewardLabel(modalReward)}</p>
              </div>
            ) : (
              <h2 className="text-foreground text-xl font-bold mb-2">Opening chest...</h2>
            )}

            <button onClick={closeModal} className="w-full h-11 rounded-[12px] bg-pacific text-ocean-dark font-bold text-sm mt-2">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rewards banner */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto text-center py-4 px-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[11px]" style={{ color: "#8BB8CC" }}>
          🏆 Your trophies track your Pacifica journey. Future reward programs will recognize top players.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chests;