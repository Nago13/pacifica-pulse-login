import { Home, Package, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { pendingBattleChestCount } = useUser();

  const navItems = [
    { icon: Home, label: "Home", path: "/play" },
    { icon: Package, label: "Baús", path: "/chests", badge: pendingBattleChestCount > 0 ? pendingBattleChestCount : null },
    { icon: BarChart3, label: "Ranking", path: "/leaderboard" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-nav-bg flex items-center justify-around py-3 z-20"
      style={{ borderTop: "1px solid rgba(92,200,232,0.1)" }}
    >
      {navItems.map((item) => {
        const active = pathname === item.path;
        return (
          <Link key={item.label} to={item.path} className="relative flex flex-col items-center gap-1">
            <div className="relative">
              <item.icon size={22} className={active ? "text-pacific" : "text-ocean-muted"} />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-danger text-foreground text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] ${active ? "text-pacific font-medium" : "text-ocean-muted"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
