import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Camera,
  Clock,
  ArrowRight,
  User,
  Car,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { PersistentObject, Camera as CameraType } from '../types';

export const ObjectsPage: React.FC = () => {
  const [objects, setObjects] = useState<PersistentObject[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();

  const getImageUrl = (obj: PersistentObject) => {
    if (obj.primary_image_url) return obj.primary_image_url;
    if (!obj.primary_evidence_image) return '';
    const cleanPath = obj.primary_evidence_image.replace(/\\/g, '/');
    if (cleanPath.startsWith('/media/')) return cleanPath;
    if (cleanPath.startsWith('evidence/')) return `/media/${cleanPath}`;
    return `/media/evidence/${cleanPath}`;
  };

  useEffect(() => {
    api.get('/cameras/')
      .then((res) => setCameras(res.data.results || res.data))
      .catch(() => {});
  }, []);

  const fetchObjects = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (selectedType) params.object_type = selectedType;
    if (selectedCamera) params.camera = selectedCamera;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    api.get('/objects/', { params })
      .then((res) => {
        setObjects(res.data.results || res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchObjects();
  }, [selectedType, selectedCamera, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchObjects();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Eye className="w-6 h-6 text-[#2563EB]" />
            Tracked Objects & ReID Intelligence
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Persistent cross-camera identities, visit frequencies, appearance models, and evidence captures
          </p>
        </div>

        <button
          onClick={fetchObjects}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
          Refresh Directory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search object ID (e.g. #0042)..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Object class pills */}
          <div className="flex gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
            {[
              { val: '', label: 'All Classes' },
              { val: 'person', label: 'People' },
              { val: 'car', label: 'Vehicles' },
              { val: 'animal', label: 'Animals' },
            ].map((t) => (
              <button
                key={t.val}
                type="button"
                onClick={() => setSelectedType(t.val)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedType === t.val
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Sources / Cameras</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.camera_id}>
                {c.camera_id} ({c.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Objects Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B]">Loading tracked object identities...</div>
      ) : objects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-subtle">
          <Eye className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="card-heading text-[#0F172A]">No objects matched filters</h3>
          <p className="text-xs text-[#64748B] mt-1">Objects detected by YOLOv8 and ByteTrack will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {objects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => navigate(`/objects/${obj.id}`)}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-subtle hover:border-[#2563EB] hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Crop / Evidence Image thumbnail */}
                <div className="aspect-square bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  {getImageUrl(obj) ? (
                    <img
                      src={getImageUrl(obj)}
                      alt={obj.internal_id}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-500" />
                  )}

                  {/* ID Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white font-bold">
                    {obj.internal_id}
                  </div>

                  {/* Class Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-[#2563EB] border border-blue-100 shadow-xs">
                    {obj.object_type}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-semibold text-[#0F172A]">{obj.internal_id}</span>
                    <span className="text-[11px] font-semibold text-[#2563EB]">
                      {obj.total_visits} visit{obj.total_visits > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <strong className="text-[#0F172A] font-mono">{formatDuration(obj.total_duration_seconds)}</strong>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span>First Seen:</span>
                      <span className="text-[#0F172A]">{new Date(obj.first_seen).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span>Last Seen:</span>
                      <span className="text-[#0F172A]">{new Date(obj.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#7C3AED] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ReID Active
                </span>
                <span className="text-[#2563EB] font-medium flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                  Profile <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
