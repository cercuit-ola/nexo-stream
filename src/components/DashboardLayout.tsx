import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, CalendarClock, Lock, Wallet,
  Gift, FileText, Settings, LogOut, Bell, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/scheduler', icon: CalendarClock, label: 'Income Scheduler' },
  { to: '/dashboard/vault', icon: Lock, label: 'NexolPay Vault' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet & Off-Ramp' },
  { to: '/dashboard/giftcard', icon: Gift, label: 'Gift Card' },
  { to: '/dashboard/transactions', icon: FileText, label: 'Transactions' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground text-lg">
            N
          </div>
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
        {/* KYC Banner */}
        {profile && profile.kyc_status !== 'verified' && (
          <div className="kyc-banner">
            ⚠️ Complete KYC to unlock all features
          </div>
        )}

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-primary font-bold">
              {profile?.usdc_balance?.toFixed(2) ?? '0.00'} USDC
            </span>
            <span className="inline-flex items-center rounded-full bg-amber/20 px-3 py-1 text-xs font-medium text-amber">
              Stellar Testnet
            </span>
            <button className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
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
