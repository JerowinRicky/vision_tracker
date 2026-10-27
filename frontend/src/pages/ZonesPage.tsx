import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Sliders,
  ShieldAlert,
  Clock,
  Users,
  Eye,
  CheckCircle2,
  Camera as CameraIcon
} from 'lucide-react';
import { api } from '../services/api';
import { Zone, Camera } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isOperator } = useAuth();

  const [formData, setFormData] = useState({
    camera: undefined as number | undefined,
    name: '',
    zone_type: 'restricted' as Zone['zone_type'],
    rules: ['person_entry', 'dwell_time'],
    max_dwell_seconds: 60,
    max_occupancy: 5,
    color_hex: '#2563EB',
    polygon_points: [
      { x: 100, y: 150 },
      { x: 400, y: 150 },
      { x: 400, y: 400 },
      { x: 100, y: 400 },
    ],
  });

  const fetchZones = () => {
    api.get('/zones/')
      .then((res) => setZones(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchCameras = () => {
    api.get('/cameras/')
      .then((res) => {
        const data = res.data.results || res.data;
        setCameras(data);
        if (data.length > 0 && !formData.camera) {
          setFormData((prev) => ({ ...prev, camera: data[0].id }));
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchZones();
    fetchCameras();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/zones/', formData);
      setIsModalOpen(false);
      fetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this polygon zone?")) return;
    try {
      await api.delete(`/zones/${id}/`);
      setZones(zones.filter((z) => z.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#2563EB]" />
            Spatial Geofences & Polygon Zones
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Configure ray-casting spatial geofences, dwell loitering guards, and occupancy thresholds
          </p>
        </div>

        {isOperator && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Polygon Zone
          </button>
        )}
      </div>

      {/* Zones Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B]">Loading configured polygon zones...</div>
      ) : zones.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-subtle">
          <MapPin className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="card-heading text-[#0F172A]">No spatial zones configured</h3>
          <p className="text-xs text-[#64748B] mt-1">Define polygon geofences to detect perimeter breaches and loitering.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {zones.map((z) => (
            <div
              key={z.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: z.color_hex }}
                    />
                    <h3 className="card-heading text-[#0F172A]">{z.name}</h3>
                  </div>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                    {z.zone_type}
                  </span>
                </div>

                {/* SVG Visual Polygon Contour Mockup */}
                <div className="relative aspect-video bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] overflow-hidden mb-3 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 500">
                    <polygon
                      points={z.polygon_points?.map((p) => `${p.x},${p.y}`).join(' ') || "100,100 400,100 350,400 150,400"}
                      fill={`${z.color_hex}20`}
                      stroke={z.color_hex}
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white text-[10px] font-mono text-[#0F172A] border border-[#E2E8F0] shadow-xs">
                    {z.camera_id || 'DEFAULT'}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Camera Stream:</span>
                    <strong className="text-[#0F172A]">{z.camera_name || 'Default Stream'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Dwell Loitering:</span>
                    <strong className="text-[#0F172A] font-mono">{z.max_dwell_seconds}s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity / Occupancy:</span>
                    <strong className="text-[#0F172A] font-mono">{z.max_occupancy} max</strong>
                  </div>
                </div>
              </div>

              {isOperator && (
                <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1 rounded text-[#64748B] hover:text-rose-600 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-lg w-full p-6 shadow-modal space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <h2 className="card-heading text-[#0F172A]">Define Polygon Geofence Zone</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Restricted Vault Corridor"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Associated Camera</label>
                  <select
                    value={formData.camera}
                    onChange={(e) => setFormData({ ...formData, camera: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.camera_id} &bull; {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Zone Category</label>
                  <select
                    value={formData.zone_type}
                    onChange={(e) => setFormData({ ...formData, zone_type: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="restricted">Restricted Area</option>
                    <option value="entrance">Entrance</option>
                    <option value="parking">Parking</option>
                    <option value="reception">Reception</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="custom">Custom Zone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Max Dwell Time (sec)</label>
                  <input
                    type="number"
                    value={formData.max_dwell_seconds}
                    onChange={(e) => setFormData({ ...formData, max_dwell_seconds: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium shadow-sm"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
