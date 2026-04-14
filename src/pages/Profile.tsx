import { useState } from "react";
import { Trophy, Flame, Copy, Check, Home, Award, BarChart3, User, ArrowUp, ArrowDown } from "lucide-react";

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const predictions = [
  { asset: "BTC", icon: "₿", color: "text-warning", direction: "subiu", pct: "+2.4%", win: true, trophies: "+25", date: "Hoje, 14:30" },
  { asset: "ETH", icon: "Ξ", color: "text-pacific", direction: "caiu", pct: "-1.1%", win: false, trophies: "−15", date: "Hoje, 10:00" },
  { asset: "SOL", icon: "S", color: "text-success", direction: "subiu", pct: "+5.2%", win: true, trophies: "+30", date: "Ontem, 18:00" },
  { asset: "BTC", icon: "₿", color: "text-warning", direction: "subiu", pct: "+0.8%", win: true, trophies: "+20", date: "Ontem, 12:00" },
  { asset: "ETH", icon: "Ξ", color: "text-pacific", direction: "caiu", pct: "-3.1%", win: false, trophies: "−15", date: "12 Abr, 09:00" },
];

const cardStyle = {
  border: "1px solid rgba(92,200,232,0.15)",
};

const Profile = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://pacifica.fi/pulse/pedro_ITA");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = encodeURIComponent("🌊 Estou jogando Pacifica Pulse! Preveja cripto e ganhe troféus 🏆\n\nEntre pelo meu link 👇");
  const tweetUrl = encodeURIComponent("https://pacifica.fi/pulse/pedro_ITA");

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5">

          {/* SECTION 1 — Hero */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-ocean-button flex items-center justify-center text-foreground font-bold text-xl border-2 border-pacific">
              PE
            </div>
            <div className="text-center">
              <h1 className="text-foreground text-2xl font-bold">Pedro</h1>
              <p className="text-ocean-muted text-sm">@pedro_ITA</p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full mt-1">
              {[
                { label: "Liga", value: "Ouro" },
                { label: "Troféus", value: "847" },
                { label: "Streak", value: "5 dias" },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] bg-card-surface p-3 flex flex-col items-center gap-0.5" style={cardStyle}>
                  <span className="text-ocean-muted text-[10px]">{s.label}</span>
                  <span className="text-foreground font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2 — Liga */}
          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: "1px solid rgba(245,166,35,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} className="text-warning" />
              <span className="text-foreground font-bold">Liga Ouro</span>
            </div>
            <div className="flex items-center justify-between text-xs text-ocean-muted mb-1.5">
              <span>847 troféus</span>
              <span>1.800</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-ocean-dark">
              <div className="h-full rounded-full bg-pacific transition-all" style={{ width: "47%" }} />
            </div>
            <p className="text-ocean-muted text-xs mt-2">Faltam 953 troféus para subir para Platina</p>
          </div>

          {/* SECTION 3 — Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Taxa de acerto", value: "68%", color: "text-success" },
              { label: "Total de previsões", value: "142", color: "text-foreground" },
              { label: "Melhor streak", value: "14 dias", color: "text-warning" },
              { label: "Ranking global", value: "#142", color: "text-pacific" },
            ].map((s) => (
              <div key={s.label} className="rounded-[16px] bg-card-surface p-4 flex flex-col gap-1" style={cardStyle}>
                <span className="text-ocean-muted text-xs">{s.label}</span>
                <span className={`${s.color} font-bold text-xl`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* SECTION 4 — Referral */}
          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: "1px solid rgba(92,200,232,0.4)" }}>
            <h3 className="text-foreground font-bold mb-1">Convide amigos e ganhe</h3>
            <p className="text-ocean-muted text-xs mb-4">Você ganha troféus + % dos ganhos do amigo para sempre</p>

            <div className="flex items-center rounded-[8px] bg-ocean-dark px-3 py-2.5 mb-3">
              <span className="text-pacific text-sm truncate flex-1">pacifica.fi/pulse/pedro_ITA</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleCopy}
                className="h-10 rounded-[12px] bg-ocean-button text-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 rounded-[12px] bg-ocean-button text-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              >
                <XIcon />
                Compartilhar
              </a>
            </div>

            <p className="text-ocean-muted text-[11px]">3 amigos convidados · 240 troféus de referral ganhos</p>
          </div>

          {/* SECTION 5 — Last Predictions */}
          <div className="rounded-[16px] bg-card-surface p-5" style={cardStyle}>
            <h3 className="text-foreground font-bold mb-4">Últimas previsões</h3>
            <div className="flex flex-col">
              {predictions.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-3">
                    <div className={`w-9 h-9 rounded-full bg-ocean-dark flex items-center justify-center ${p.color} font-bold text-sm shrink-0`}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium">
                        {p.asset} {p.direction} <span className={p.win ? "text-success" : "text-danger"}>{p.pct}</span>
                      </p>
                      <p className="text-ocean-muted text-[11px]">{p.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.win ? <ArrowUp size={12} className="text-success" /> : <ArrowDown size={12} className="text-danger" />}
                      <span className={`text-sm font-bold ${p.win ? "text-success" : "text-danger"}`}>{p.trophies}</span>
                    </div>
                  </div>
                  {i < predictions.length - 1 && (
                    <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-nav-bg flex items-center justify-around py-3 z-20" style={{ borderTop: "1px solid rgba(92,200,232,0.1)" }}>
        {[
          { icon: Home, label: "Home", active: false },
          { icon: Trophy, label: "Troféus", active: false },
          { icon: BarChart3, label: "Ranking", active: false },
          { icon: User, label: "Perfil", active: true },
        ].map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-1">
            <item.icon size={22} className={item.active ? "text-pacific" : "text-ocean-muted"} />
            <span className={`text-[10px] ${item.active ? "text-pacific font-medium" : "text-ocean-muted"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Profile;
