import { Home, Trophy, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/play" },
  { icon: Trophy, label: "Troféus", path: "/leaderboard" },
  { icon: BarChart3, label: "Ranking", path: "/leaderboard" },
  { icon: User, label: "Perfil", path: "/profile" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-nav-bg flex items-center justify-around py-3 z-20"
      style={{ borderTop: "1px solid rgba(92,200,232,0.1)" }}
    >
      {navItems.map((item) => {
        const active = pathname === item.path;
        return (
          <Link key={item.label} to={item.path} className="flex flex-col items-center gap-1">
            <item.icon size={22} className={active ? "text-pacific" : "text-ocean-muted"} />
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
