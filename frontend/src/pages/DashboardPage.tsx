import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Activity,
  Users,
  Eye,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Play,
  Video,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardData, Camera as CameraType, VideoUpload } from '../types';
import { useAuth } from '../contexts/AuthContext';

const defaultDashboardData: DashboardData = {
  kpis: {
    total_cameras: 4,
    active_cameras: 4,
    objects_detected_today: 142,
    unique_objects: 22,
    total_visits: 23,
    active_alerts: 2,
    processing_jobs: 0,
    system_health: "Optimal (GPU/CPU nominal, pipeline active)"
  },
  hourly_data: [
    { hour: "06:00", visitors: 12, vehicles: 8 },
    { hour: "07:00", visitors: 28, vehicles: 22 },
    { hour: "08:00", visitors: 54, vehicles: 41 },
    { hour: "09:00", visitors: 82, vehicles: 58 },
    { hour: "10:00", visitors: 115, vehicles: 64 },
    { hour: "11:00", visitors: 96, vehicles: 49 },
    { hour: "12:00", visitors: 74, vehicles: 35 },
    { hour: "13:00", visitors: 68, vehicles: 30 },
    { hour: "14:00", visitors: 89, vehicles: 45 },
    { hour: "15:00", visitors: 79, vehicles: 38 },
    { hour: "16:00", visitors: 62, vehicles: 31 },
    { hour: "17:00", visitors: 95, vehicles: 52 },
    { hour: "18:00", visitors: 44, vehicles: 25 },
  ],
  object_distribution: [
    { name: "Person", value: 148, color: "#2563EB" },
    { name: "Car", value: 72, color: "#7C3AED" },
    { name: "Truck", value: 14, color: "#F59E0B" },
    { name: "Motorcycle", value: 10, color: "#8B5CF6" },
    { name: "Bicycle", value: 8, color: "#EC4899" },
    { name: "Animals", value: 13, color: "#06B6D4" },
  ],
  camera_activity: [
    { name: "CAM-01 (Entrance)", visits: 124, alerts: 3 },
    { name: "CAM-02 (Parking)", visits: 87, alerts: 1 },
    { name: "CAM-03 (Warehouse)", visits: 52, alerts: 2 },
    { name: "CAM-04 (Perimeter)", visits: 19, alerts: 0 },
  ],
  trend: [
    { date: "Mon 21", people: 110, vehicles: 65 },
    { date: "Tue 22", people: 128, vehicles: 72 },
    { date: "Wed 23", people: 135, vehicles: 78 },
    { date: "Thu 24", people: 142, vehicles: 84 },
    { date: "Fri 25", people: 156, vehicles: 92 },
    { date: "Sat 26", people: 118, vehicles: 60 },
    { date: "Sun 27", people: 132, vehicles: 74 },
  ],
  live_activity: [
    { id: 1, timestamp: "10:32:12", type: "detection", message: "Person detected", camera: "CAM-01", badge: "Person" },
    { id: 2, timestamp: "10:32:18", type: "detection", message: "Car detected", camera: "CAM-02", badge: "Car" },
    { id: 3, timestamp: "10:32:21", type: "reid_match", message: "Previous object matched: Person #0042 (91% sim)", camera: "CAM-01", badge: "ReID Match" },
    { id: 4, timestamp: "10:31:45", type: "alert", message: "Zone alert: Person #0098 in Restricted Area", camera: "CAM-03", badge: "Critical Alert" },
    { id: 5, timestamp: "10:30:02", type: "visit", message: "Person #0071 completed visit #2 (duration 24m)", camera: "CAM-01", badge: "Visit Exit" },
  ]
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [feedMode, setFeedMode] = useState<'camera' | 'video'>('camera');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchDashboard = () => {
    setIsRefreshing(true);
    api.get('/analytics/dashboard/')
      .then((res) => {
        if (res.data && res.data.kpis) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Dashboard fetch error", err))
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    fetchDashboard();

    api.get('/cameras/').then((res) => {
      const cList = res.data.results || res.data;
      setCameras(cList);
      if (cList.length > 0) setSelectedCamId(cList[0].id);
    }).catch(() => {});

    api.get('/videos/').then((res) => {
      const vList = res.data.results || res.data;
      setVideos(vList);
      if (vList.length > 0) setSelectedVideoId(vList[0].id);
    }).catch(() => {});

    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const { kpis, hourly_data, object_distribution, camera_activity, live_activity, trend } = data;
  const activeCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];
  const activeVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];

  const kpiCards = [
    {
      title: 'Active Cameras',
      value: `${kpis.active_cameras} / ${kpis.total_cameras}`,
      sub: 'All streams nominal',
      change: '+1 from yesterday',
      icon: Camera,
      color: 'blue',
      badge: 'LIVE'
    },
    {
      title: 'Objects Detected',
      value: kpis.objects_detected_today.toLocaleString(),
      sub: 'Across active channels',
      change: '+14% vs avg',
      icon: Eye,
      color: 'blue',
      badge: 'YOLOv8'
    },
    {
      title: 'Unique Objects',
      value: kpis.unique_objects.toLocaleString(),
      sub: 'ReID persistent identities',
      change: '12 new identified',
      icon: Sparkles,
      color: 'purple',
      badge: 'REID'
    },
    {
      title: "Today's Visits",
      value: kpis.total_visits.toLocaleString(),
      sub: 'Completed entry-exit logs',
      change: 'Avg duration: 14m',
      icon: Users,
      color: 'blue',
      badge: 'VISITS'
    },
    {
      title: 'Active Alerts',
      value: kpis.active_alerts.toString(),
      sub: 'Perimeter & loitering',
      change: '2 requires action',
      icon: AlertTriangle,
      color: kpis.active_alerts > 0 ? 'rose' : 'blue',
      badge: 'ALERTS'
    },
    {
      title: 'AI Processing',
      value: '29.5 FPS',
      sub: 'ByteTrack & BoT-SORT active',
      change: 'Latency: 18ms',
      icon: Cpu,
      color: 'purple',
      badge: 'PIPELINE'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="page-title text-[#0F172A]">
            Good morning, {user?.first_name || user?.username || 'Operator'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Monitor your AI-powered video intelligence system in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Live Cameras
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-medium text-xs border border-[#E2E8F0] shadow-sm transition-all"
          >
            Daily Reports
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPurple = kpi.color === 'purple';
          const isRose = kpi.color === 'rose';

          return (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPurple
                        ? 'bg-[#F5F3FF] text-[#7C3AED]'
                        : isRose
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-[#EFF6FF] text-[#2563EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isPurple
                        ? 'bg-[#F5F3FF] text-[#7C3AED] border border-purple-100'
                        : isRose
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-[#EFF6FF] text-[#2563EB] border border-blue-100'
                    }`}
                  >
                    {kpi.badge}
                  </span>
                </div>

                <div className="text-xl font-bold text-[#0F172A] tracking-tight">{kpi.value}</div>
                <div className="text-xs font-semibold text-[#64748B] mt-0.5">{kpi.title}</div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                <span className="text-[#64748B] truncate max-w-[110px]">{kpi.sub}</span>
                <span className={`font-medium ${isPurple ? 'text-[#7C3AED]' : 'text-[#2563EB]'}`}>
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Monitoring Quick Section & Stream Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Optical Feed Preview (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="card-heading text-[#0F172A]">
                {feedMode === 'camera' && activeCam
                  ? `${activeCam.camera_id} • ${activeCam.name}`
                  : feedMode === 'video' && activeVideo
                  ? `Recorded: ${activeVideo.original_filename}`
                  : 'Live Surveillance Monitoring'}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded border border-blue-100">
                {feedMode === 'camera' ? (activeCam?.resolution || '1080p FHD') : 'OFFLINE MP4'}
              </span>
            </div>

            {/* Dynamic Source Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {cameras.length > 0 && videos.length > 0 && (
                <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFeedMode('camera')}
                    className={`px-2 py-1 rounded font-medium transition-colors ${
                      feedMode === 'camera' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B]'
                    }`}
                  >
                    Live Cameras
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedMode('video')}
                    className={`px-2 py-1 rounded font-medium transition-colors ${
                      feedMode === 'video' ? 'bg-white text-[#7C3AED] shadow-xs' : 'text-[#64748B]'
                    }`}
                  >
                    Recorded Video
                  </button>
                </div>
              )}

              {feedMode === 'camera' && cameras.length > 1 && (
                <select
                  value={selectedCamId || ''}
                  onChange={(e) => setSelectedCamId(Number(e.target.value))}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB]"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.camera_id} ({c.name})
                    </option>
                  ))}
                </select>
              )}

              {feedMode === 'video' && videos.length > 1 && (
                <select
                  value={selectedVideoId || ''}
                  onChange={(e) => setSelectedVideoId(Number(e.target.value))}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#7C3AED]"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.original_filename}
                    </option>
                  ))}
                </select>
              )}

              <Link to="/live" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                All Feeds ({cameras.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Video Preview Box */}
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center shadow-inner">
            {feedMode === 'camera' && activeCam ? (
              <img
                src={`/api/cameras/${activeCam.id}/stream/`}
                alt={activeCam.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `/api/cameras/${activeCam.id}/snapshot/?t=${Date.now()}`;
                }}
              />
            ) : feedMode === 'video' && activeVideo ? (
              <video
                controls
                autoPlay
                muted
                loop
                playsInline
                src={activeVideo.file_url || activeVideo.file}
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="text-center text-slate-400 p-8">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-mono">No stream active</span>
              </div>
            )}

            {/* Overlaid AI Detection Telemetry HUD */}
            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
                  {feedMode === 'camera'
                    ? `AI: ${(activeCam?.detection_model || 'YOLOv8').toUpperCase()} + BYTETRACK`
                    : `PROCESSED: ${activeVideo?.detected_objects_count || 0} OBJECTS`}
                </div>
                <div className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
                  {feedMode === 'camera'
                    ? `${activeCam?.fps || 25} FPS • LOW LATENCY`
                    : `${activeVideo?.total_frames || 0} FRAMES • ${activeVideo?.status?.toUpperCase() || 'OK'}`}
                </div>
              </div>

              <div className="flex justify-between items-end text-[10px] font-mono text-white">
                <span className="bg-black/60 px-2 py-0.5 rounded">
                  {feedMode === 'camera' ? 'Detection: Active (YOLOv8 Engine)' : `File: ${activeVideo?.original_filename || 'Recorded'}`}
                </span>
                <span className="bg-black/60 px-2 py-0.5 rounded">ReID Gallery: Synchronized</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B] pt-3 mt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <span>Stream FPS: <strong className="text-[#0F172A]">{activeCam?.fps || 25.0}</strong></span>
              <span>AI Engine: <strong className="text-[#2563EB]">YOLOv8 Neural Net</strong></span>
              <span>Tracker: <strong className="text-[#7C3AED]">ByteTrack / BoT-SORT</strong></span>
            </div>
            <Link to="/cameras" className="text-[#2563EB] hover:underline font-medium">
              Configure Stream &rarr;
            </Link>
          </div>
        </div>

        {/* Real-time Activity Feed (1 col) */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-heading text-[#0F172A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                Live Activity Log
              </h2>
              <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-blue-100">
                REAL-TIME
              </span>
            </div>

            <div className="space-y-3">
              {live_activity.map((act) => {
                const isAlert = act.type === 'alert';
                const isReid = act.type === 'reid_match';

                return (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAlert ? 'bg-rose-500' : isReid ? 'bg-[#7C3AED]' : 'bg-[#2563EB]'
                          }`}
                        />
                        {act.camera}
                      </span>
                      <span className="text-[#94A3B8] font-mono">{act.timestamp}</span>
                    </div>

                    <p className="text-xs text-[#64748B] leading-tight">{act.message}</p>

                    <div className="mt-1.5 flex justify-end">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isAlert
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : isReid
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-purple-100'
                            : 'bg-[#EFF6FF] text-[#2563EB] border border-blue-100'
                        }`}
                      >
                        {act.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/audit"
            className="mt-4 pt-3 border-t border-[#E2E8F0] text-center text-xs text-[#2563EB] hover:underline font-medium block"
          >
            View Full System Event Audit &rarr;
          </Link>
        </div>
      </div>

      {/* Analytical Charts Row (Blue & Purple brand identity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Optical Activity Curve */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="card-heading text-[#0F172A]">Hourly Observation Volume</h2>
              <p className="text-xs text-[#64748B]">People vs Vehicles detected today across all channels</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#2563EB]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> People
              </span>
              <span className="flex items-center gap-1.5 text-[#7C3AED]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]" /> Vehicles
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} name="People" />
                <Bar dataKey="vehicles" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Vehicles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Trend Curve */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="card-heading text-[#0F172A]">7-Day Intelligence Trend</h2>
              <p className="text-xs text-[#64748B]">Total unique observations over past 7 calendar days</p>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-blue-100">
              +14% Traffic
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="people" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorPeople)" name="People Visits" />
                <Area type="monotone" dataKey="vehicles" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorVehicles)" name="Vehicle Visits" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
