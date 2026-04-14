import { Trophy, Flame, TrendingUp, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";

const weekData = [60, 85, 45, 90, 70, 95, 80];
const days = ["S", "T", "Q", "Q", "S", "S", "D"];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen font-dm-sans">
      {/* Left Side - 55% */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center bg-gradient-to-br from-ocean-dark to-ocean-deep">
        <span className="absolute text-[80px] xl:text-[100px] font-bold select-none pointer-events-none" style={{ color: "rgba(255,255,255,0.08)" }}>
          Pacifica Pulse
        </span>
        <div className="relative z-10 animate-float bg-ocean-card backdrop-blur-md rounded-[16px] border border-pacific/20 p-8 w-[380px] shadow-2xl">
          <h3 className="text-pacific font-bold text-lg mb-6">Seus números</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <Trophy className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-lg">1.847</span>
              <span className="text-ocean-muted text-xs">troféus</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <TrendingUp className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-sm">Platina</span>
              <span className="text-ocean-muted text-xs">liga atual</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <Flame className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-lg">14</span>
              <span className="text-ocean-muted text-xs">dias streak</span>
            </div>
          </div>
          <div>
            <p className="text-ocean-muted text-xs mb-3">Acertos da semana</p>
            <div className="flex items-end justify-between gap-2 h-20">
              {weekData.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-pacific/80 rounded-t-md transition-all" style={{ height: `${val}%` }} />
                  <span className="text-ocean-muted text-[10px]">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - 45% */}
      <div className="w-full lg:w-[45%] bg-ocean-dark flex items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 animate-stagger-1">
            <Waves className="text-pacific" size={36} />
            <span className="text-foreground font-bold text-2xl">Pacifica Pulse</span>
          </div>
          <p className="text-ocean-muted text-base animate-stagger-2">Preveja. Compita. Vença.</p>
          <button
            onClick={() => navigate("/play")}
            className="animate-stagger-3 w-full flex items-center justify-center gap-3 bg-ocean-button border border-pacific rounded-[12px] px-6 py-4 text-foreground font-medium transition-all duration-200 hover:bg-pacific hover:text-ocean-dark"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Continuar com Google
          </button>
          <p className="text-ocean-muted text-xs text-center animate-stagger-4">
            Ao entrar, sua carteira Solana é criada automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
