import { Rocket } from "lucide-react";

interface PacificaConversionCardProps {
  hitRate: string;
  totalPredictions: number;
}

const PacificaConversionCard = ({ hitRate, totalPredictions }: PacificaConversionCardProps) => {
  return (
    <div
      className="rounded-[16px] p-5 mb-4"
      style={{ background: "#0F2235", border: "1px solid #5CC8E8" }}
    >
      <Rocket size={24} style={{ color: "#5CC8E8" }} />
      <h3 className="text-foreground font-bold mt-2" style={{ fontSize: 16 }}>
        Ready for real trading?
      </h3>
      <p className="mt-1" style={{ color: "#8BB8CC", fontSize: 13, lineHeight: 1.6 }}>
        You've mastered the predictions. Take your skills to Pacifica's live perp markets.
      </p>
      {totalPredictions > 0 ? (
        <p className="font-bold mt-2" style={{ color: "#1DB887", fontSize: 13 }}>
          Your hit rate: {hitRate} — you're ready.
        </p>
      ) : (
        <p className="mt-2" style={{ color: "#8BB8CC", fontSize: 13 }}>
          Start playing to unlock your stats
        </p>
      )}
      <button
        onClick={() => window.open("https://pacifica.fi", "_blank")}
        className="w-full font-bold mt-3 transition-all hover:opacity-80"
        style={{
          background: "#5CC8E8",
          color: "#0D1B2A",
          fontSize: 15,
          borderRadius: 10,
          padding: 14,
        }}
      >
        Open Pacifica DEX →
      </button>
      <p className="text-center mt-2" style={{ color: "#8BB8CC", fontSize: 10 }}>
        Trade BTC, ETH, SOL with up to 50x leverage
      </p>
    </div>
  );
};

export default PacificaConversionCard;
