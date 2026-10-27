import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Clock,
  Users,
  Camera,
  Activity,
  Calendar,
  Layers,
  BarChart2,
  Flame,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardData } from '../types';

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

interface ZoneAnalytics {
  id: number;
  name: string;
  zone_type: string;
  camera_id: string;
  camera_name: string;
  max_occupancy: number;
  current_occupancy: number;
  max_dwell_seconds: number;
  total_events: number;
  breaches: number;
  color_hex: string;
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'heatmap' | 'zones'>('trends');
  const [loading, setLoading] = useState(true);

  // Heatmap state
  const [selectedCamera, setSelectedCamera] = useState<string>('CAM-01');
  const [selectedClass, setSelectedClass] = useState<string>('person');
  const [heatmapPoints, setHeatmapPoints] = useState<HeatPoint[]>([]);
  const [heatLoading, setHeatLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zones analytics state
  const [zonesData, setZonesData] = useState<ZoneAnalytics[]>([]);

  useEffect(() => {
    api.get('/analytics/dashboard/')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    api.get('/analytics/zones/')
      .then((res) => setZonesData(res.data.zones || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch heatmap data when tab or filters change
  useEffect(() => {
    if (activeTab === 'heatmap') {
      setHeatLoading(true);
      api.get('/analytics/heatmap/', {
        params: { camera_id: selectedCamera, class_name: selectedClass }
      })
        .then((res) => {
          setHeatmapPoints(res.data.points || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setHeatLoading(false));
    }
  }, [activeTab, selectedCamera, selectedClass]);

  // Render HTML5 Canvas Heatmap
  useEffect(() => {
    if (activeTab !== 'heatmap' || !canvasRef.current || heatmapPoints.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Light blueprint/grid background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Scale from 1280x720 coordinates to canvas size
    const scaleX = width / 1280;
    const scaleY = height / 720;

    // Render radial heat gradients with Blue/Purple palette
    heatmapPoints.forEach((pt) => {
      const cx = pt.x * scaleX;
      const cy = pt.y * scaleY;
      const radius = 32;

      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
      grad.addColorStop(0, `rgba(37, 99, 235, ${0.5 * pt.intensity})`);    // Primary AI Blue center
      grad.addColorStop(0.4, `rgba(124, 58, 237, ${0.35 * pt.intensity})`); // AI Purple
      grad.addColorStop(0.8, `rgba(224, 231, 255, ${0.2 * pt.intensity})`); // Light soft blue
      grad.addColorStop(1, 'rgba(37, 99, 235, 0)');                         // Fade

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Outer border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, width, height);
  }, [activeTab, heatmapPoints]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  const { hourly_data, camera_activity, trend } = data;

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#2563EB]" />
            Spatial Analytics & Intelligence
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Hourly traffic distributions, movement density heatmaps, and spatial geofence metrics
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white border border-[#E2E8F0] rounded-lg p-1 shadow-subtle text-xs">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'trends' ? 'bg-[#2563EB] text-white shadow-xs font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Observation Curves
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'heatmap' ? 'bg-[#2563EB] text-white shadow-xs font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Movement Heatmap
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'zones' ? 'bg-[#2563EB] text-white shadow-xs font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Zone Occupancy
          </button>
        </div>
      </div>

      {/* Tab 1: Observation Curves */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Top 7-day Multi-series Trend */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="card-heading text-[#0F172A]">7-Day Observation Trajectory</h2>
                <p className="text-xs text-[#64748B]">People vs Vehicles recorded over past 7 calendar days</p>
              </div>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-blue-100">
                +14% Traffic vs Prior Cycle
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="people" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} name="People Visits" />
                  <Line type="monotone" dataKey="vehicles" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} name="Vehicle Visits" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side by side hourly and camera distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
              <h2 className="card-heading text-[#0F172A] mb-1">Hourly Optical Traffic Curve</h2>
              <p className="text-xs text-[#64748B] mb-4">Peak hours and pedestrian congestion times</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} name="People" />
                    <Bar dataKey="vehicles" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Vehicles" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
              <h2 className="card-heading text-[#0F172A] mb-1">Camera Stream Activity Matrix</h2>
              <p className="text-xs text-[#64748B] mb-4">Visits and alerts per optical sensor</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={camera_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="visits" fill="#2563EB" radius={[4, 4, 0, 0]} name="Visits" />
                    <Bar dataKey="alerts" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Alerts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Trajectory Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[#64748B] font-semibold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                Camera Stream:
              </span>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="CAM-01">CAM-01 (Main Entrance)</option>
                <option value="CAM-02">CAM-02 (Parking Deck)</option>
                <option value="CAM-03">CAM-03 (Warehouse)</option>
                <option value="CAM-04">CAM-04 (Perimeter)</option>
              </select>

              <span className="text-[#64748B] font-semibold flex items-center gap-1.5 ml-2">
                <Filter className="w-3.5 h-3.5 text-[#7C3AED]" />
                Target Class:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">All Classes</option>
                <option value="person">People Only</option>
                <option value="car">Vehicles Only</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-[#64748B]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" /> High Density
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] inline-block" /> Moderate
              </span>
              <span>&bull;</span>
              <span>Data Points: <strong>{heatmapPoints.length}</strong></span>
            </div>
          </div>

          {/* HTML5 Canvas Viewport */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col items-center shadow-subtle">
            {heatLoading ? (
              <div className="w-full aspect-video flex items-center justify-center text-[#64748B] text-xs">
                Rendering movement density contours...
              </div>
            ) : (
              <div className="w-full max-w-4xl relative overflow-hidden rounded-lg border border-[#E2E8F0] shadow-xs">
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={540}
                  className="w-full h-auto block"
                />
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded text-xs font-mono text-[#0F172A] border border-[#E2E8F0] shadow-subtle">
                  {selectedCamera} &bull; Accumulated Spatial Path Density (ByteTrack Coordinates)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Zone Occupancy */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {zonesData.map((z) => (
              <div
                key={z.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className="w-3 h-3 rounded-full mt-1"
                      style={{ backgroundColor: z.color_hex }}
                    />
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                      {z.zone_type}
                    </span>
                  </div>

                  <h3 className="card-heading text-[#0F172A]">{z.name}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Camera: {z.camera_id} ({z.camera_name})</p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-[#0F172A]">
                      <span>Live Occupancy:</span>
                      <strong className="font-mono">
                        {z.current_occupancy} / {z.max_occupancy} max
                      </strong>
                    </div>

                    <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          z.current_occupancy >= z.max_occupancy
                            ? 'bg-rose-500'
                            : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${Math.min(100, (z.current_occupancy / z.max_occupancy) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[#64748B] pt-1">
                      <span>Max Dwell Time:</span>
                      <span className="font-mono text-[#0F172A]">{z.max_dwell_seconds}s</span>
                    </div>

                    <div className="flex justify-between text-[#64748B]">
                      <span>Total Zone Events:</span>
                      <span className="font-mono text-[#2563EB] font-semibold">{z.total_events}</span>
                    </div>

                    {z.breaches > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold pt-1">
                        <span>Breaches Detected:</span>
                        <span className="font-mono">{z.breaches}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
