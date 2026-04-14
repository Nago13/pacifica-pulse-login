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
    name: "Clássico",
    description: "Sobe ou cai em 60 segundos",
    badge: "ATIVO",
    badgeColor: "bg-success text-ocean-dark",
    icon: ArrowUpDown,
  },
  {
    id: "battle" as GameMode,
    name: "Batalha",
    description: "Qual moeda valoriza mais?",
    badge: "NOVO",
    badgeColor: "bg-pacific text-ocean-dark",
    icon: Circle,
  },
  {
    id: "precision" as GameMode,
    name: "Precisão",
    description: "Acerte o tamanho da variação",
    badge: "NOVO",
    badgeColor: "bg-pacific text-ocean-dark",
    icon: Target,
  },
];

const GameModeSelector = ({ selected, onSelect, disabled }: GameModeSelectorProps) => {
  return (
    <div className="w-full max-w-lg">
      <span className="text-ocean-muted text-xs uppercase tracking-wider font-medium mb-3 block">
        Modo de jogo
      </span>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {modes.map((mode) => {
          const isSelected = selected === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => !disabled && onSelect(mode.id)}
              disabled={disabled}
              className={`flex-shrink-0 w-[140px] rounded-[16px] p-4 flex flex-col items-start gap-2 transition-all duration-200 text-left ${
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
