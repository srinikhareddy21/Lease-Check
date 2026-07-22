import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  UploadCloud,
  Settings as SettingsIcon,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  Info,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/analyze", label: "Upload Lease", icon: UploadCloud },
];

const secondaryItems = [
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/about", label: "About", icon: Info },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const content = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center h-16 shrink-0 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold text-primary dark:text-white">
            <span className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-soft shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </span>
            LeaseCheck
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-soft">
            <FileText className="w-4 h-4 text-white" />
          </Link>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group relative ${
                isActive
                  ? "bg-secondary/10 text-secondary"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className={`h-px bg-slate-200 dark:bg-slate-800 my-3 ${collapsed ? "mx-1" : ""}`} />

        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-secondary/10 text-secondary"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 shrink-0">
        <button
          onClick={onToggle}
          className={`hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-600 dark:hover:text-slate-300 w-full transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <PanelLeftOpen className="w-4.5 h-4.5" /> : <PanelLeftClose className="w-4.5 h-4.5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="hidden lg:block shrink-0 border-r border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 h-screen"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onCloseMobile} />
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-950 shadow-2xl"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
}
