import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, BarChart2, Users, ShoppingBag, Store, FileCheck, Sun, Moon, Search, Layers, Briefcase, MessageSquare, AlertTriangle, Shield, ScrollText, Settings, Navigation, MoreHorizontal, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from './ui/IconButton';
import { SearchPill } from './ui/SearchPill';
import { SegmentedControl } from './ui/SegmentedControl';

const PRIMARY_NAV = [
  { path: '/', label: 'Dashboard', icon: BarChart2 },
  { path: '/applications', label: 'Applications', icon: FileCheck },
  { path: '/products', label: 'Products', icon: ShoppingBag },
  { path: '/shops', label: 'Shops', icon: Store },
];

const SECONDARY_NAV = [
  { path: '/categories', label: 'Categories', icon: Layers },
  { path: '/banners', label: 'Banners', icon: Briefcase },
  { path: '/comments', label: 'Comments', icon: MessageSquare },
  { path: '/reports', label: 'Reports', icon: AlertTriangle },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/roles', label: 'Roles', icon: Shield },
  { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname;

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [language, setLanguage] = useState('O\'zbek');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
      if (window.innerWidth >= 1280) setDrawerOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drawer/sheet/menu on navigation
  useEffect(() => {
    setDrawerOpen(false);
    setMoreSheetOpen(false);
    setLangMenuOpen(false);
  }, [current]);

  const handleNav = (path: string) => navigate(path);

  const NavItem = ({ path, label, icon: Icon, onClick, isBottomNav = false }: any) => {
    const active = current === path || (path !== '/' && current.startsWith(path));
    if (isBottomNav) {
      return (
        <button onClick={() => { if (onClick) onClick(); else handleNav(path); }} className="flex flex-col items-center justify-center gap-1 w-full p-2 outline-none">
          <Icon size={20} className={cn("transition-colors duration-200", active ? "text-accent" : "text-muted")} />
          <span className={cn("text-[10px] font-medium transition-colors duration-200", active ? "text-accent" : "text-muted")}>{label}</span>
        </button>
      );
    }
    return (
      <button onClick={() => { if (onClick) onClick(); else handleNav(path); }} className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none group",
        active ? "bg-accent/10 text-accent" : "text-sidebar-text hover:bg-sidebar-hover hover:text-main"
      )}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={cn("transition-colors", active ? "text-accent" : "text-muted group-hover:text-main")} />
        <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="app-scrollbar flex flex-col h-full bg-sidebar border-r border-border overflow-y-auto">
      <div className="p-6 bg-sidebar hidden xl:flex md:flex flex-col gap-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold"><Navigation size={18} /></div>
          <span className="font-bold text-lg text-main">Clothes MP</span>
        </div>
        <p className="text-xs text-muted mt-2 ml-1 hidden lg:block">{user?.email}</p>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-8">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 ml-4">Main</p>
          <div className="flex flex-col gap-1">
            {PRIMARY_NAV.map((item) => <NavItem key={item.path} {...item} />)}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 ml-4">Management</p>
          <div className="flex flex-col gap-1">
            {SECONDARY_NAV.map((item) => <NavItem key={item.path} {...item} />)}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors outline-none font-medium text-sm">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background text-main overflow-hidden">

      {/* Desktop Sidebar */}
      {!isMobile && !isTablet && (
        <aside className="w-[260px] flex-shrink-0 h-full">
          <SidebarContent />
        </aside>
      )}

      {/* Tablet Drawer */}
      <AnimatePresence>
        {isTablet && drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed top-0 left-0 bottom-0 w-[260px] z-50 shadow-premium">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            {isTablet && (
              <IconButton variant="ghost" onClick={() => setDrawerOpen(true)}>
                <Menu size={20} />
              </IconButton>
            )}
            <SearchPill placeholder="Search everything..." containerClassName="hidden md:flex w-64" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <IconButton
                variant="soft"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={cn(
                  "hidden sm:flex transition-all duration-200 border-2",
                  langMenuOpen ? "border-[#2563EB] bg-[#1E293B] text-white" : "border-transparent text-muted"
                )}
                title={language}
              >
                <Globe size={20} />
              </IconButton>

              <AnimatePresence>
                {langMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setLangMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 w-40 bg-[#1e2329] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[#2b313a] overflow-hidden z-50 flex flex-col"
                    >
                      {['O\'zbek', 'Русский', 'English'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            setLangMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-5 py-3.5 text-[15px] font-semibold transition-colors tracking-tight",
                            language === lang
                              ? "bg-[#22C55E] text-black"
                              : "text-white hover:bg-[#2b313a]"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <IconButton
              variant="soft"
              onClick={toggleTheme}
              className="hidden sm:flex"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            <IconButton variant="soft" className="relative">
              <AlertTriangle size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
            </IconButton>
          </div>
        </header>

        {/* Page Content */}
        <main className="app-scrollbar flex-1 overflow-y-auto p-4 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
            <NavItem path="/" label="Dashboard" icon={BarChart2} isBottomNav />
            <NavItem path="/applications" label="Apps" icon={FileCheck} isBottomNav />
            <NavItem path="/products" label="Products" icon={ShoppingBag} isBottomNav />
            <NavItem path="/shops" label="Shops" icon={Store} isBottomNav />
            <NavItem path="#" label="More" icon={MoreHorizontal} isBottomNav onClick={() => setMoreSheetOpen(true)} />
          </nav>
        )}

        {/* Mobile More Sheet */}
        <AnimatePresence>
          {isMobile && moreSheetOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoreSheetOpen(false)} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 flex flex-col max-h-[85vh]">
                <div className="flex justify-center p-3">
                  <div className="w-12 h-1.5 bg-border rounded-full" />
                </div>
                <div className="app-scrollbar overflow-y-auto p-6 flex flex-col gap-6 pb-safe">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <span className="font-semibold">{user?.email}</span>
                    <div className="flex gap-2">
                      <IconButton size="sm" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                      </IconButton>
                      <IconButton size="sm" variant="ghost" onClick={() => { logout(); navigate('/login'); }} className="text-red-500">
                        <LogOut size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-y-6">
                    {SECONDARY_NAV.map(item => (
                      <button key={item.path} onClick={() => handleNav(item.path)} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-pill flex items-center justify-center text-muted">
                          <item.icon size={20} />
                        </div>
                        <span className="text-[10px] text-muted text-center font-medium leading-tight">{item.label}</span>
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
