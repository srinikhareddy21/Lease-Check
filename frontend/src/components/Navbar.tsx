import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, FileText, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

const authedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/documents", label: "Documents" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const links = isAuthenticated ? authedLinks : publicLinks;

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-primary dark:text-white">
          <span className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-soft">
            <FileText className="w-4.5 h-4.5 text-white" size={18} />
          </span>
          LeaseCheck
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
                  isActive
                    ? "text-secondary bg-secondary/10"
                    : "text-slate-600 hover:text-secondary hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 focus-ring transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="hidden sm:block">
                <ProfileMenu />
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-secondary focus-ring"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white brand-gradient shadow-soft hover:opacity-90 transition-opacity focus-ring"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  {link.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> {user?.name}
                  </Link>
                  <button onClick={handleLogout} className="text-left px-3 py-2 rounded-lg text-sm text-danger">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm">
                    Log in
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-secondary">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
