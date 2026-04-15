import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, CalendarClock, Lock, CreditCard,
  Gift, FileText, Settings, LogOut, Bell, Menu, X, ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import nexolLogo from '@/assets/nexolpay-logo.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/giftcard', icon: Gift, label: 'Gift Cards' },
  { to: '/dashboard/virtual-card', icon: CreditCard, label: 'Virtual Card' },
  { to: '/dashboard/scheduler', icon: CalendarClock, label: 'Income Scheduler' },
  { to: '/dashboard/vault', icon: Lock, label: 'NexolPay Vault' },
  { to: '/dashboard/transactions', icon: FileText, label: 'Transactions' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isSubPage = location.pathname !== '/dashboard';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-sidebar border-r border-sidebar-border
        transition-transform duration-300 lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <img src={nexolLogo} alt="NexolPay" className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-bold text-foreground">NexolPay</span>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="text-sm text-muted-foreground truncate mb-2">{user?.email}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            {isSubPage && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="relative flex-shrink-0">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
