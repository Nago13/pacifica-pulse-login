import { Crown } from "lucide-react";

const TIERS = [
  { leagues: "Bronze & Silver", color: "#A0AEC0", benefit: "Early access to Pacifica rewards" },
  { leagues: "Gold", color: "#F5A623", benefit: "Priority allocation in future programs" },
  { leagues: "Platinum & Diamond", color: "#5CC8E8", benefit: "Boosted rewards multiplier" },
  { leagues: "Legendary", color: "#E84855", benefit: "Exclusive Pacifica builder rewards pool access" },
];

const FutureRewardsCard = ({ currentLeague }: { currentLeague: string }) => {
  return (
    <div
      className="rounded-[16px] p-5"
      style={{ background: "#0F2235", border: "1px solid #F5A623" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Crown size={20} style={{ color: "#F5A623" }} />
        <span className="text-foreground font-bold text-[15px]">Future Rewards Program</span>
        <span
          className="text-[10px] font-bold rounded-full px-2 py-0.5 ml-auto"
          style={{ color: "#F5A623", background: "rgba(245,166,35,0.15)" }}
        >
          Coming Soon
        </span>
      </div>

      <p className="text-[13px] leading-[1.7] mb-4" style={{ color: "#8BB8CC" }}>
        Your trophies in Pacifica Pulse will determine your eligibility for future reward programs on
        Pacifica DEX. The higher your league, the bigger your potential rewards.
      </p>

      <div className="flex flex-col gap-2 mb-3">
        {TIERS.map((t) => (
          <div key={t.leagues} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
            <span className="text-[12px] font-bold text-foreground min-w-[110px]">{t.leagues}</span>
            <span className="text-[12px]" style={{ color: t.color }}>{t.benefit}</span>
          </div>
        ))}
      </div>

      <p className="text-foreground font-bold text-[13px] mt-3">
        Your current league: {currentLeague}
      </p>

      <div className="h-px w-full my-3" style={{ background: "rgba(255,255,255,0.08)" }} />

      <p className="text-[11px] italic mb-3" style={{ color: "#8BB8CC" }}>
        Reward program details will be announced officially by Pacifica. Trophies are your proof of skill — start earning now.
      </p>

      <button
        onClick={() => window.open("https://pacifica.fi", "_blank")}
        className="w-full rounded-[10px] py-2.5 px-4 font-bold text-[13px] transition-all hover:opacity-80"
        style={{ background: "transparent", border: "1px solid #F5A623", color: "#F5A623" }}
      >
        Start earning Pacifica Points →
      </button>
    </div>
  );
};

export default FutureRewardsCard;
