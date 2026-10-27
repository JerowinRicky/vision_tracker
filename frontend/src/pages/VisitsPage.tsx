import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Footprints,
  Calendar,
  Clock,
  Camera,
  Search,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Visit, Camera as CameraType } from '../types';

export const VisitsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchId, setSearchId] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    api.get('/cameras/')
      .then((res) => setCameras(res.data.results || res.data))
      .catch(() => {});
  }, []);

  const fetchVisits = () => {
    setLoading(true);
    const params: any = {};
    if (searchId) params.persistent_id = searchId;
    if (selectedCamera) params.camera = selectedCamera;
    if (selectedDate) params.date = selectedDate;

    api.get('/visits/', { params })
      .then((res) => setVisits(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVisits();
  }, [selectedCamera, selectedDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisits();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Footprints className="w-6 h-6 text-[#2563EB]" />
            Visits & Session History
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Clustered tracking sessions grouped by optical entry, dwell duration, and exit
          </p>
        </div>

        <button
          onClick={fetchVisits}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-subtle text-xs">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search object ID (#0042)..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Sources & Cameras</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.camera_id}>
                  {c.camera_id} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm"
            >
              Filter Visits
            </button>
            <button
              type="button"
              onClick={() => { setSearchId(''); setSelectedCamera(''); setSelectedDate(''); }}
              className="py-1.5 px-3 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-xs font-medium"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Visits Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-subtle">
        <table className="w-full text-left text-xs text-[#0F172A]">
          <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[11px] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-4 py-3">Object Identity</th>
              <th className="px-4 py-3">Camera / Ingestion</th>
              <th className="px-4 py-3">Visit Session #</th>
              <th className="px-4 py-3">Duration & Window</th>
              <th className="px-4 py-3">Evidence Snapshot</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-[#64748B]">Loading visit session records...</td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-[#64748B]">No visits recorded matching filters.</td>
              </tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-[#2563EB] font-mono">{v.persistent_id}</div>
                      <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-100">
                        {v.object_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="font-medium text-[#0F172A]">{v.camera_id || 'OFFLINE-REC'}</div>
                    <div className="text-[11px] text-[#64748B]">{v.camera_name || 'Recorded Video Footage'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8FAFC] border border-[#E2E8F0]">
                      Visit #{v.visit_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#0F172A] font-mono">{formatDuration(v.duration_seconds)}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      {new Date(v.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr; {new Date(v.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {v.entry_image_url ? (
                      <div className="w-14 h-9 rounded bg-slate-900 border border-[#E2E8F0] overflow-hidden">
                        <img
                          src={v.entry_image_url.replace(/\\/g, '/')}
                          alt="Entry Evidence"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#94A3B8]">Logged</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/objects/${v.persistent_object}`}
                      className="text-xs font-medium text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
