import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Camera as CameraIcon,
  UploadCloud,
  Cpu,
  Users,
  Footprints,
  FileBarChart,
  Bell,
  MapPin,
  TrendingUp,
  Settings,
  ShieldCheck,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (o: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen = () => {}
}) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'MONITORING & FEEDS', isHeader: true },
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live Cameras', icon: Video, badge: 'LIVE' },
    { to: '/cameras', label: 'Cameras', icon: CameraIcon },

    { label: 'VIDEO PIPELINE', isHeader: true },
    { to: '/videos', label: 'Video Uploads', icon: UploadCloud },
    { to: '/jobs', label: 'Video Processing', icon: Cpu },

    { label: 'AI INTELLIGENCE', isHeader: true },
    { to: '/objects', label: 'Objects', icon: Eye },
    { to: '/visits', label: 'Visits', icon: Footprints },
    { to: '/zones', label: 'Zones', icon: MapPin },
    { to: '/alerts', label: 'Alerts', icon: Bell },

    { label: 'ANALYTICS & BI', isHeader: true },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/reports', label: 'Reports', icon: FileBarChart },

    { label: 'ADMINISTRATION', isHeader: true },
    { to: '/settings', label: 'Settings', icon: Settings },
    ...(isAdmin
      ? [
          { to: '/users', label: 'Users', icon: Users },
          { to: '/audit', label: 'Audit Logs', icon: FileText },
        ]
      : []),
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 bg-white border-r border-[#E2E8F0] transition-all duration-200 flex flex-col ${
        mobileOpen
          ? 'translate-x-0 w-64 shadow-xl'
          : 'max-lg:-translate-x-full'
      } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base text-[#0F172A] tracking-tight flex items-center gap-1.5">
                VisionTrack
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded font-mono border border-blue-100">
                  AI
                </span>
              </span>
              <span className="text-[11px] text-[#64748B] font-medium tracking-tight">CCTV Intelligence</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.isHeader) {
            if (collapsed) return null;
            return (
              <div
                key={idx}
                className="pt-4 pb-1.5 px-3 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase"
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#2563EB] before:rounded-r'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse toggle button on desktop */}
      <div className="hidden lg:flex items-center justify-end px-3 py-2 border-t border-[#E2E8F0] bg-white">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User profile footer */}
      {!collapsed && (
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-200 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {user?.username?.slice(0, 2) || 'VT'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] truncate">{user?.username || 'Operator'}</p>
              <p className="text-[11px] text-[#64748B] capitalize">{user?.role || 'viewer'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
