import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Moon, Sun, Trash2, User as UserIcon, Bell, Lock, Globe } from "lucide-react";
import { usersApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h2 className="font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
        <Icon className="w-4.5 h-4.5 text-secondary" /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: usersApi.getSettings });

  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    notify_analysis_complete: true,
    notify_report_ready: true,
    notify_upload_failed: true,
    notify_export_complete: false,
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  useEffect(() => {
    if (settings) {
      setNotifPrefs({
        notify_analysis_complete: settings.notify_analysis_complete,
        notify_report_ready: settings.notify_report_ready,
        notify_upload_failed: settings.notify_upload_failed,
        notify_export_complete: settings.notify_export_complete,
      });
    }
  }, [settings]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await usersApi.updateProfile({ name });
      await refreshUser();
      showToast("Profile updated.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't save profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await usersApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      showToast("Password changed.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await usersApi.updateSettings({ [key]: updated[key] });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await usersApi.deleteAccount(deletePassword);
      showToast("Account deleted.", "success");
      await logout();
      navigate("/");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't delete account.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-white mb-2">Settings</h1>

      <Section icon={UserIcon} title="Profile">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white text-2xl font-semibold">
              {name?.[0]?.toUpperCase() || "U"}
            </span>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input
              value={user?.email || ""}
              disabled
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-400"
            />
          </div>
          <Button type="submit" loading={savingProfile}>
            Save changes
          </Button>
        </form>
      </Section>

      <Section icon={Lock} title="Password">
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
            />
          </div>
          <Button type="submit" loading={savingPassword}>
            Update password
          </Button>
        </form>
      </Section>

      <Section icon={Sun} title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
            <p className="text-xs text-slate-400">Choose light or dark mode</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setTheme("light")}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${theme === "light" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${theme === "dark" ? "bg-slate-700 shadow-sm text-white" : "text-slate-500"}`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {[
            { key: "notify_analysis_complete" as const, label: "Analysis complete" },
            { key: "notify_report_ready" as const, label: "Report ready" },
            { key: "notify_upload_failed" as const, label: "Upload failed" },
            { key: "notify_export_complete" as const, label: "Export complete" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
              <button
                type="button"
                onClick={() => toggleNotif(item.key)}
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  notifPrefs[item.key] ? "bg-secondary" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    notifPrefs[item.key] ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </Section>

      <Section icon={Globe} title="Language">
        <select
          defaultValue={settings?.language || "en"}
          onChange={(e) => usersApi.updateSettings({ language: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </Section>

      <div className="glass-card p-6 border-l-4 border-l-danger">
        <h2 className="font-semibold text-danger mb-2 flex items-center gap-2">
          <Trash2 className="w-4.5 h-4.5" /> Delete Account
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          This permanently deletes your account and all of your documents and analyses. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <Button variant="danger" size="md" onClick={() => setShowDeleteConfirm(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Confirm your password"
              className="flex-1 px-3 py-2.5 rounded-xl border border-danger/30 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
            />
            <Button variant="danger-solid" onClick={handleDeleteAccount} disabled={!deletePassword} loading={deleting}>
              Confirm delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
