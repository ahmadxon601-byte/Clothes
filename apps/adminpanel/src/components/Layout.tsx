import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  BarChart2,
  Users,
  ShoppingBag,
  Store,
  FileCheck,
  Sun,
  Moon,
  Layers,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  Shield,
  ScrollText,
  Settings,
  Navigation,
  MoreHorizontal,
  Globe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton } from "./ui/IconButton";
import { SearchPill } from "./ui/SearchPill";

const PRIMARY_NAV = [
  { path: "/", labelKey: "nav.dashboard", icon: BarChart2 },
  { path: "/applications", labelKey: "nav.applications", icon: FileCheck },
  { path: "/products", labelKey: "nav.products", icon: ShoppingBag },
  { path: "/shops", labelKey: "nav.shops", icon: Store },
];

const SECONDARY_NAV = [
  { path: "/categories", labelKey: "nav.categories", icon: Layers },
  { path: "/banners", labelKey: "nav.banners", icon: Briefcase },
  { path: "/comments", labelKey: "nav.comments", icon: MessageSquare },
  { path: "/reports", labelKey: "nav.reports", icon: AlertTriangle },
  { path: "/users", labelKey: "nav.users", icon: Users },
  { path: "/roles", labelKey: "nav.roles", icon: Shield },
  { path: "/audit-logs", labelKey: "nav.auditLogs", icon: ScrollText },
  { path: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname;

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
      if (window.innerWidth >= 1280) setDrawerOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setMoreSheetOpen(false);
    setLangMenuOpen(false);
  }, [current]);

  const handleNav = (path: string) => navigate(path);

  const NavItem = ({
    path,
    labelKey,
    icon: Icon,
    onClick,
    isBottomNav = false,
  }: any) => {
    const active = current === path || (path !== "/" && current.startsWith(path));
    const label = t(labelKey);
    if (isBottomNav) {
      return (
        <button
          onClick={() => {
            if (onClick) onClick();
            else handleNav(path);
          }}
          className="flex flex-col items-center justify-center gap-1 w-full p-2 outline-none"
        >
          <Icon size={20} className={cn("transition-colors duration-200", active ? "text-accent" : "text-muted")} />
          <span className={cn("text-[10px] font-medium transition-colors duration-200", active ? "text-accent" : "text-muted")}>
            {label}
          </span>
        </button>
      );
    }
    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else handleNav(path);
        }}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none group",
          active ? "bg-accent/10 text-accent" : "text-sidebar-text hover:bg-sidebar-hover hover:text-main"
        )}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={cn("transition-colors", active ? "text-accent" : "text-muted group-hover:text-main")} />
        <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="app-scrollbar flex flex-col h-full bg-sidebar border-r border-border overflow-y-auto">
      <div className="p-6 bg-sidebar hidden xl:flex md:flex flex-col gap-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
            <Navigation size={18} />
          </div>
          <span className="font-bold text-lg text-main">Clothes MP</span>
        </div>
        <p className="text-xs text-muted mt-2 ml-1 hidden lg:block">{user?.email}</p>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-8">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 ml-4">{t("layout.main")}</p>
          <div className="flex flex-col gap-1">
            {PRIMARY_NAV.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 ml-4">{t("layout.management")}</p>
          <div className="flex flex-col gap-1">
            {SECONDARY_NAV.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors outline-none font-medium text-sm"
        >
          <LogOut size={20} />
          {t("layout.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background text-main overflow-hidden">
      {!isMobile && !isTablet && (
        <aside className="w-[260px] flex-shrink-0 h-full">
          <SidebarContent />
        </aside>
      )}

      <AnimatePresence>
        {isTablet && drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed top-0 left-0 bottom-0 w-[260px] z-50 shadow-premium">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            {isTablet && (
              <IconButton variant="ghost" onClick={() => setDrawerOpen(true)}>
                <Menu size={20} />
              </IconButton>
            )}
            <SearchPill placeholder={t("layout.search")} containerClassName="hidden md:flex w-64" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <IconButton
                variant="soft"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={cn("hidden sm:flex transition-all duration-200 border-2", langMenuOpen ? "border-[#2563EB] bg-[#1E293B] text-white" : "border-transparent text-muted")}
                title={t(`lang.${locale}`)}
              >
                <Globe size={20} />
              </IconButton>

              <AnimatePresence>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 w-40 bg-[#1e2329] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[#2b313a] overflow-hidden z-50 flex flex-col"
                    >
                      {(["uz", "ru", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLocale(lang);
                            setLangMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-5 py-3.5 text-[15px] font-semibold transition-colors tracking-tight",
                            locale === lang ? "bg-[#22C55E] text-black" : "text-white hover:bg-[#2b313a]"
                          )}
                        >
                          {t(`lang.${lang}`)}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <IconButton variant="soft" onClick={toggleTheme} className="hidden sm:flex" title={theme === "dark" ? t("theme.light") : t("theme.dark")}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </div>
        </header>

        <main className="app-scrollbar flex-1 overflow-y-auto p-4 lg:p-8 pb-24 md:pb-8">{children}</main>

        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
            <NavItem path="/" labelKey="nav.dashboard" icon={BarChart2} isBottomNav />
            <NavItem path="/applications" labelKey="nav.applications" icon={FileCheck} isBottomNav />
            <NavItem path="/products" labelKey="nav.products" icon={ShoppingBag} isBottomNav />
            <NavItem path="/shops" labelKey="nav.shops" icon={Store} isBottomNav />
            <NavItem path="#" labelKey="layout.more" icon={MoreHorizontal} isBottomNav onClick={() => setMoreSheetOpen(true)} />
          </nav>
        )}

        <AnimatePresence>
          {isMobile && moreSheetOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoreSheetOpen(false)} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 flex flex-col max-h-[85vh]">
                <div className="flex justify-center p-3">
                  <div className="w-12 h-1.5 bg-border rounded-full" />
                </div>
                <div className="app-scrollbar overflow-y-auto p-6 flex flex-col gap-6 pb-safe">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <span className="font-semibold">{user?.email}</span>
                    <div className="flex gap-2">
                      <IconButton size="sm" onClick={toggleTheme}>
                        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          logout();
                          navigate("/login");
                        }}
                        className="text-red-500"
                      >
                        <LogOut size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-y-6">
                    {SECONDARY_NAV.map((item) => (
                      <button key={item.path} onClick={() => handleNav(item.path)} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-pill flex items-center justify-center text-muted">
                          <item.icon size={20} />
                        </div>
                        <span className="text-[10px] text-muted text-center font-medium leading-tight">{t(item.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

