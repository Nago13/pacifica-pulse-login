import { useEffect, useState } from "react";

interface PacificaResultBannerProps {
  league: string;
}

const PacificaResultBanner = ({ league }: PacificaResultBannerProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const validLeagues = ["Gold", "Platinum", "Diamond", "Legendary"];
    if (!validLeagues.includes(league)) return;
    if (sessionStorage.getItem("pacificaBannerShown")) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("pacificaBannerShown", "true");
    }, 1500);
    return () => clearTimeout(timer);
  }, [league]);

  if (!show) return null;

  return (
    <div
      className="w-full max-w-md mt-4 rounded-[12px] flex items-center justify-between"
      style={{
        background: "#1A3A4E",
        borderTop: "1px solid #5CC8E8",
        padding: "12px 16px",
      }}
    >
      <span className="text-foreground font-bold text-[13px]">
        {league} league trader — ready for Pacifica?
      </span>
      <button
        onClick={() => window.open("https://pacifica.fi", "_blank")}
        className="font-bold transition-all hover:opacity-80 shrink-0"
        style={{
          background: "#5CC8E8",
          color: "#0D1B2A",
          fontSize: 11,
          padding: "6px 12px",
          borderRadius: 8,
        }}
      >
        Trade now →
      </button>
    </div>
  );
};

export default PacificaResultBanner;
