import { useState, useEffect } from "react";
import { Trophy, Flame, Crown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

const tabs = ["Global", "Amigos", "Semanal"];
const leagues = ["Todos", "Bronze", "Prata", "Ouro", "Platina", "Diamante", "Lendária"];

const leagueBadgeColors: Record<string, string> = {
  Bronze: "bg-[#CD7F32]/20 text-[#CD7F32]",
  Prata: "bg-[#A8B2BB]/20 text-[#A8B2BB]",
  Ouro: "bg-warning/20 text-warning",
  Platina: "bg-pacific/20 text-pacific",
  Diamante: "bg-[#B9F2FF]/20 text-[#B9F2FF]",
  "Lendária": "bg-danger/20 text-danger",
};

const medalColors = ["text-warning", "text-[#A8B2BB]", "text-[#CD7F32]"];

interface Player {
  rank: number;
  name: string;
  initials: string;
  league: string;
  streak: number;
  trophies: number;
}

const cardBorder = { border: "1px solid rgba(92,200,232,0.15)" };

// Fallback data
const fallbackTop: Player[] = [
  { rank: 1, name: "CryptoKing", initials: "CK", league: "Lendária", streak: 32, trophies: 4210 },
  { rank: 2, name: "SolanaWhale", initials: "SW", league: "Diamante", streak: 21, trophies: 3890 },
  { rank: 3, name: "BitHunter", initials: "BH", league: "Diamante", streak: 18, trophies: 3650 },
];
const fallbackOthers: Player[] = Array.from({ length: 17 }, (_, i) => ({
  rank: i + 4,
  name: ["MoonShot", "DeFiPro", "HODLer", "AltMaster", "ChartWiz", "TokenAce", "BlockPro", "HashKing", "SwapGuru", "YieldMax", "StakePro", "GasLow", "APYking", "LPfarmer", "BullRun", "BearTrap", "PumpIt"][i],
  initials: ["MS", "DP", "HL", "AM", "CW", "TA", "BP", "HK", "SG", "YM", "SP", "GL", "AK", "LF", "BR", "BT", "PI"][i],
  league: ["Platina", "Platina", "Ouro", "Ouro", "Ouro", "Ouro", "Prata", "Prata", "Prata", "Prata", "Bronze", "Bronze", "Bronze", "Bronze", "Bronze", "Bronze", "Bronze"][i],
  streak: Math.floor(Math.random() * 15) + 1,
  trophies: 3500 - i * 140 + Math.floor(Math.random() * 50),
}));

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("Global");
  const [activeLeague, setActiveLeague] = useState("Todos");
  const { user } = useUser();

  const [topPlayers, setTopPlayers] = useState<Player[]>(fallbackTop);
  const [otherPlayers, setOtherPlayers] = useState<Player[]>(fallbackOthers);
  const [currentUserRank, setCurrentUserRank] = useState<Player>({
    rank: 142, name: "Pedro", initials: "PE", league: "Ouro", streak: 5, trophies: 847,
  });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username, trophies, streak, league")
          .order("trophies", { ascending: false })
          .limit(20);

        if (error || !data || data.length === 0) return;

        const players: Player[] = data.map((u, i) => ({
          rank: i + 1,
          name: u.username,
          initials: u.username.slice(0, 2).toUpperCase(),
          league: u.league ?? "Bronze",
          streak: u.streak ?? 0,
          trophies: u.trophies ?? 0,
        }));

        if (players.length >= 3) {
          setTopPlayers(players.slice(0, 3));
          setOtherPlayers(players.slice(3));
        }

        // Find current user rank
        if (user) {
          const idx = players.findIndex((p) => p.name === user.username);
          if (idx >= 0) {
            setCurrentUserRank(players[idx]);
          } else {
            setCurrentUserRank({
              rank: players.length + 1,
              name: user.username,
              initials: user.username.slice(0, 2).toUpperCase(),
              league: user.league,
              streak: user.streak,
              trophies: user.trophies,
            });
          }
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
    };
    fetchLeaderboard();
  }, [user]);

  const podiumOrder = [topPlayers[1], topPlayers[0], topPlayers[2]];
  const podiumHeights = ["h-28", "h-36", "h-24"];
  const podiumDelays = ["animate-stagger-2", "animate-stagger-1", "animate-stagger-3"];

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="w-full max-w-[520px] mx-auto flex flex-col gap-5">
          <h1 className="text-foreground text-2xl font-bold">Leaderboard</h1>

          <div className="flex gap-6 border-b border-foreground/5">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`pb-2.5 text-sm font-medium transition-all ${activeTab === t ? "text-foreground border-b-2 border-pacific" : "text-ocean-muted hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {leagues.map((l) => (
              <button key={l} onClick={() => setActiveLeague(l)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${activeLeague === l ? "bg-pacific text-ocean-dark" : "bg-card-surface text-ocean-muted hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {podiumOrder.map((p, i) => (
              <div key={p.rank} className={`flex flex-col items-center gap-2 ${podiumDelays[i]}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-ocean-button flex items-center justify-center text-foreground font-bold text-sm border-2 border-pacific/30">{p.initials}</div>
                  {i === 1 && <Crown size={16} className="text-warning absolute -top-2 left-1/2 -translate-x-1/2" />}
                </div>
                <span className="text-foreground text-xs font-medium truncate max-w-[80px]">{p.name}</span>
                <span className="text-pacific text-xs font-bold">{p.trophies.toLocaleString()}</span>
                <div className={`w-20 ${podiumHeights[i]} rounded-t-lg flex items-start justify-center pt-2`}
                  style={{
                    background: i === 1
                      ? "linear-gradient(180deg, rgba(245,166,35,0.25) 0%, rgba(15,34,53,1) 100%)"
                      : i === 0
                      ? "linear-gradient(180deg, rgba(168,178,187,0.2) 0%, rgba(15,34,53,1) 100%)"
                      : "linear-gradient(180deg, rgba(205,127,50,0.2) 0%, rgba(15,34,53,1) 100%)",
                  }}>
                  <span className={`text-lg font-bold ${medalColors[i === 1 ? 0 : i === 0 ? 1 : 2]}`}>
                    {i === 1 ? "1º" : i === 0 ? "2º" : "3º"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] bg-ocean-button p-3 flex items-center gap-3" style={{ border: "1px solid hsl(195,74%,64%)" }}>
            <div className="flex flex-col"><span className="text-ocean-muted text-[11px]">Sua posição</span></div>
            <span className="text-pacific text-xl font-bold">#{currentUserRank.rank}</span>
            <div className="w-8 h-8 rounded-full bg-ocean-dark flex items-center justify-center text-foreground text-xs font-bold border border-pacific/30">{currentUserRank.initials}</div>
            <span className="text-foreground text-sm font-medium">{currentUserRank.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${leagueBadgeColors[currentUserRank.league] ?? ""}`}>{currentUserRank.league}</span>
            <span className="text-foreground text-sm font-bold ml-auto">{currentUserRank.trophies.toLocaleString()}</span>
            <Trophy size={14} className="text-pacific" />
          </div>

          <div className="flex items-center gap-2 px-4">
            <div className="flex-1 border-t border-dashed border-foreground/10" />
            <span className="text-ocean-muted text-xs">···</span>
            <div className="flex-1 border-t border-dashed border-foreground/10" />
          </div>

          <div className="rounded-[16px] bg-card-surface overflow-hidden" style={cardBorder}>
            {otherPlayers.map((p, i) => (
              <div key={p.rank}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-ocean-muted text-sm font-medium w-7 text-right shrink-0">{p.rank}</span>
                  <div className="w-8 h-8 rounded-full bg-ocean-dark flex items-center justify-center text-foreground text-[10px] font-bold shrink-0">{p.initials}</div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-foreground text-sm font-medium truncate">{p.name}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${leagueBadgeColors[p.league] ?? ""}`}>{p.league}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Flame size={12} className="text-warning" />
                    <span className="text-ocean-muted text-xs">{p.streak}</span>
                  </div>
                  <span className="text-foreground text-sm font-bold w-12 text-right shrink-0">{p.trophies.toLocaleString()}</span>
                </div>
                {i < otherPlayers.length - 1 && <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.04)" }} />}
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Leaderboard;
