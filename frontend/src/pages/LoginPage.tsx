import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock, User as UserIcon, AlertCircle, Video, Cpu, Sparkles, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await api.post('/auth/login/', { username, password });
      const { access, refresh, user } = resp.data;
      login(access, refresh, user);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Invalid username or password. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row antialiased">
      {/* Left Branding Hero Section */}
      <div className="lg:w-1/2 bg-white border-r border-[#E2E8F0] p-8 lg:p-16 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl text-[#0F172A] tracking-tight">
                VisionTrack <span className="text-[#2563EB]">AI</span>
              </span>
              <span className="block text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                Video Intelligence & CCTV Analytics
              </span>
            </div>
          </div>

          <div className="mt-16 max-w-lg">
            <h1 className="text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight">
              Enterprise AI Computer Vision & Video Intelligence Platform
            </h1>
            <p className="mt-4 text-sm text-[#64748B] leading-relaxed">
              Connect ONVIF/RTSP cameras and NVRs, detect and track multi-class objects in real time, monitor spatial polygon zones, and resolve identities across camera streams with appearance ReID.
            </p>

            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-xs font-medium text-[#0F172A]">Real-time YOLOv8 object detection & ByteTrack / BoT-SORT multi-target tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-xs font-medium text-[#0F172A]">Cross-camera appearance Re-Identification with probabilistic similarity scoring</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-xs font-medium text-[#0F172A]">Spatial polygon geofences, dwell loitering detection, and real-time alerts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-between">
          <span>VisionTrack AI Engine v2.0</span>
          <span>Light Mode &bull; Production SaaS</span>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-subtle p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-[#64748B] mt-1">Enter your platform credentials to access the intelligence console.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Password
                </label>
                <span className="text-[11px] text-[#2563EB] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-10 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
                />
                <span className="text-xs text-[#64748B]">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In to Platform'
              )}
            </button>
          </form>

          {/* Quick select demo credentials */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-2">Demo Credentials:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123456'); }}
                className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => { setUsername('operator'); setPassword('operator123456'); }}
                className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => { setUsername('viewer'); setPassword('viewer123456'); }}
                className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-slate-100 transition-colors"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
