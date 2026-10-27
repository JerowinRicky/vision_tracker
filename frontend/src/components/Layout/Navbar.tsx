import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  Search,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (o: boolean) => void;
  activeAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen = () => {},
  activeAlertsCount = 2
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  // Derive current page title from pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard Overview';
      case '/live': return 'Live Optical Feeds';
      case '/cameras': return 'CCTV Camera Management';
      case '/videos': return 'Video Uploads & Recordings';
      case '/jobs': return 'Video Processing Tasks';
      case '/objects': return 'Tracked Objects Intelligence';
      case '/visits': return 'Visit Sessions & Logs';
      case '/zones': return 'Polygon Spatial Zones';
      case '/alerts': return 'Security Alert Center';
      case '/analytics': return 'Spatial Analytics & Heatmaps';
      case '/reports': return 'Intelligence Reports & Exports';
      case '/settings': return 'System Configuration';
      case '/users': return 'User Directory & Access Roles';
      case '/audit': return 'System Audit Logs';
      default:
        if (path.startsWith('/objects/')) return 'Object Intelligence Profile';
        return 'VisionTrack AI';
    }
  };

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/objects?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const sampleNotifications = [
    { id: 1, type: 'reid', title: 'ReID Match Verified', desc: 'Person #0042 recognized on CAM-01 (92% sim)', time: '3m ago' },
    { id: 2, type: 'zone', title: 'Restricted Zone Breach', desc: 'Target entered Vault Corridor', time: '12m ago' },
    { id: 3, type: 'system', title: 'Stream Reconnected', desc: 'CAM-03 auto-reconnected via RTSP backoff', time: '28m ago' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-30 px-6 flex items-center justify-between shadow-subtle">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-[#0F172A] leading-tight">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camera, object ID, license plate, zone..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-14 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded font-mono">
            ↵
          </kbd>
        </div>
      </form>

      {/* Right side: System Status, Notifications, Settings, Profile */}
      <div className="flex items-center gap-3">
        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-[11px] font-medium text-[#64748B]">
            {isConnected ? 'Pipeline Active' : 'Disconnected'}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-modal p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A]">Real-Time Notifications</span>
                <Link
                  to="/alerts"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-[#2563EB] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {sampleNotifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-[#0F172A]">{n.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Shortcut */}
        <Link
          to="/settings"
          className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          title="System Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </Link>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#0F172A]">{user?.username || 'Operator'}</span>
            <span className="text-[11px] text-[#64748B] capitalize">{user?.role || 'viewer'}</span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
