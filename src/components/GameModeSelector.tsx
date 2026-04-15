import { ArrowUpDown, Circle, Target } from "lucide-react";

export type GameMode = "classic" | "battle" | "precision";

interface GameModeSelectorProps {
  selected: GameMode;
  onSelect: (mode: GameMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: "classic" as GameMode,
    name: "Classic",
    description: "Up or down in 60 seconds",
    badge: "MOST PLAYED",
    badgeColor: "bg-[#1D9E75] text-white",
    icon: ArrowUpDown,
  },
  {
    id: "battle" as GameMode,
    name: "Battle",
    description: "Which coin gains more?",
    badge: "HOT",
    badgeColor: "bg-danger text-white",
    icon: Circle,
  },
  {
    id: "precision" as GameMode,
    name: "Precision",
    description: "Predict the variation size",
    badge: "BIGGEST WIN",
    badgeColor: "bg-warning text-ocean-dark",
    icon: Target,
  },
];

const GameModeSelector = ({ selected, onSelect, disabled }: GameModeSelectorProps) => {
  return (
    <div className="w-full max-w-lg">
      <span className="text-ocean-muted text-xs uppercase tracking-wider font-medium mb-3 block">
        Game Mode
      </span>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => {
          const isSelected = selected === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => !disabled && onSelect(mode.id)}
              disabled={disabled}
              className={`rounded-[16px] p-4 flex flex-col items-start gap-2 transition-all duration-200 text-left ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                isSelected
                  ? "bg-ocean-button border-2 border-pacific"
                  : "bg-card-surface border border-[rgba(92,200,232,0.15)] hover:border-pacific/40"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={20} className={isSelected ? "text-pacific" : "text-ocean-muted"} />
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mode.badgeColor}`}>
                  {mode.badge}
                </span>
              </div>
              <span className={`text-sm font-bold ${isSelected ? "text-foreground" : "text-ocean-muted"}`}>
                {mode.name}
              </span>
              <span className="text-ocean-muted text-[11px] leading-tight">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameModeSelector;