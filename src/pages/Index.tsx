import { useEffect } from "react";
import { Trophy, Flame, TrendingUp, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";

const weekData = [60, 85, 45, 90, 70, 95, 80];
const days = ["M", "T", "W", "T", "F", "S", "S"];

const Index = () => {
  const navigate = useNavigate();
  const { login, authenticated, ready } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      navigate("/play");
    }
  }, [ready, authenticated, navigate]);

  return (
    <div className="flex min-h-screen font-dm-sans">
      <div className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center bg-gradient-to-br from-ocean-dark to-ocean-deep">
        <span className="absolute text-[80px] xl:text-[100px] font-bold select-none pointer-events-none" style={{ color: "rgba(255,255,255,0.08)" }}>
          Pacifica Pulse
        </span>
        <div className="relative z-10 animate-float bg-ocean-card backdrop-blur-md rounded-[16px] border border-pacific/20 p-8 w-[380px] shadow-2xl">
          <h3 className="text-pacific font-bold text-lg mb-6">Your stats</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <Trophy className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-lg">1,847</span>
              <span className="text-ocean-muted text-xs">trophies</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <TrendingUp className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-sm">Platinum</span>
              <span className="text-ocean-muted text-xs">current league</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-ocean-dark/50 rounded-xl p-4">
              <Flame className="text-pacific" size={24} />
              <span className="text-foreground font-bold text-lg">14</span>
              <span className="text-ocean-muted text-xs">day streak</span>
            </div>
          </div>
          <div>
            <p className="text-ocean-muted text-xs mb-3">Weekly hits</p>
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

      <div className="w-full lg:w-[45%] bg-ocean-dark flex items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 animate-stagger-1">
            <Waves className="text-pacific" size={36} />
            <span className="text-foreground font-bold text-2xl">Pacifica Pulse</span>
          </div>
          <p className="text-ocean-muted text-base animate-stagger-2">Predict. Compete. Win.</p>
          <button
            onClick={() => login()}
            className="animate-stagger-3 w-full flex items-center justify-center gap-3 bg-pacific border border-pacific rounded-[12px] px-6 py-4 text-ocean-dark font-bold transition-all duration-200 hover:brightness-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Continue with Email
          </button>
          <p className="text-ocean-muted text-[11px] text-center animate-stagger-4">
            Or sign in with Google after entering your email
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
