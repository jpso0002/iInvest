import { Link } from "@tanstack/react-router";
import Icon from "../Icon";
import { useAppStore } from "@/store/useAppStore";
import { simulateTabUnlocked } from "@/lib/guards";
import "./TabBar.css";

export function TabBar() {
  const user = useAppStore((s) => s.user);
  const unlocked = simulateTabUnlocked(user);

  return (
    <nav className="tab-bar" aria-label="Primary">
      <TabItem to="/lessons" icon="chart-line" label="Lessons" />
      {unlocked ? (
        <TabItem to="/simulate" icon="wallet" label="Simulate" />
      ) : (
        <LockedTab />
      )}
      <TabItem to="/news" icon="news" label="News" />
      <TabItem to="/league" icon="trophy" label="League" />
      <TabItem to="/profile" icon="user" label="Profile" />
    </nav>
  );
}

function LockedTab() {
  return (
    <div className="tab-bar-item" aria-hidden="true">
      <Icon name="lock" size={22} />
    </div>
  );
}

function TabItem({
  to,
  icon,
  label,
}: {
  to: "/lessons" | "/simulate" | "/news" | "/league" | "/profile";
  icon: string;
  label: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="tab-bar-item"
      activeProps={{ className: "tab-bar-item tab-bar-item--active" }}
      activeOptions={{ exact: false }}
    >
      <Icon name={icon} size={22} />
    </Link>
  );
}
