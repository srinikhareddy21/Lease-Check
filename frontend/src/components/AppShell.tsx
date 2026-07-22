import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, Moon, Sun, FileText } from "lucide-react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "@/context/ThemeContext";

const COLLAPSE_KEY = "leasecheck_sidebar_collapsed";

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, !v ? "1" : "0");
      return !v;
    });
  };

  return (
    <div className="flex min-h-screen bg-paper dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="lg:hidden flex items-center gap-2 font-display font-semibold text-primary dark:text-white">
              <span className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </span>
              LeaseCheck
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 focus-ring transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
