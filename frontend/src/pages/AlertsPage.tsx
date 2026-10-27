import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CheckCheck,
  Filter,
  RefreshCw,
  ShieldAlert,
  Check,
  XCircle,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';
import { useWebSocket } from '../contexts/WebSocketContext';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { subscribe } = useWebSocket();

  const fetchAlerts = () => {
    setLoading(true);
    const params: any = {};
    if (priorityFilter) params.priority = priorityFilter;
    if (statusFilter) params.status = statusFilter;

    api.get('/alerts/', { params })
      .then((res) => setAlerts(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();

    const unsub = subscribe('alert.created', (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => unsub();
  }, [priorityFilter, statusFilter]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.post(`/alerts/${id}/acknowledge/`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', is_read: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.post(`/alerts/${id}/resolve/`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED', is_read: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/alerts/${id}/dismiss/`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'DISMISSED', is_read: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/alerts/mark_all_read/');
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority?: string, severity?: string) => {
    const p = (priority || severity || 'MEDIUM').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
      case 'WARNING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
      case 'INFO':
      default:
        return 'bg-[#EFF6FF] text-[#2563EB] border-blue-200';
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'NEW').toUpperCase();
    switch (s) {
      case 'NEW':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ACKNOWLEDGED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISMISSED':
        return 'bg-slate-100 text-[#64748B] border-[#E2E8F0]';
      default:
        return 'bg-slate-50 text-[#0F172A] border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#2563EB]" />
            Security & Spatial Alert Center
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Rule-based perimeter breaches, dwell loitering violations, and cross-camera ReID matches
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-[#2563EB]" />
          Mark All as Read
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#64748B] font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
            Priority:
          </span>
          <div className="flex gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
            {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  priorityFilter === p
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {p || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#64748B] font-semibold flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-[#7C3AED]" />
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0]"
            title="Refresh Alerts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-[#64748B] text-xs">Loading alert triggers...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-subtle">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="card-heading text-[#0F172A]">No active alerts</h3>
            <p className="text-xs text-[#64748B] mt-1">All spatial geofences, cameras, and optical sensors are nominal.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                alert.status === 'NEW' || !alert.is_read
                  ? 'bg-white border-[#E2E8F0] shadow-subtle'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.priority === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-600'
                      : alert.priority === 'HIGH'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-[#EFF6FF] text-[#2563EB]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(alert.priority, alert.severity)}`}>
                      {alert.priority || alert.severity}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(alert.status)}`}>
                      {alert.status || 'NEW'}
                    </span>
                    <h3 className="font-semibold text-[#0F172A] text-sm">{alert.title}</h3>
                  </div>

                  <p className="text-xs text-[#64748B] mt-1">{alert.message}</p>

                  <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] text-[#94A3B8] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    <span>&bull;</span>
                    <span>Source: {alert.camera_id || 'Recorded Ingestion'}</span>
                    {alert.zone_name && (
                      <>
                        <span>&bull;</span>
                        <span>Zone: {alert.zone_name}</span>
                      </>
                    )}
                    {alert.object_type && (
                      <>
                        <span>&bull;</span>
                        <span className="capitalize">Target: {alert.object_type} #{alert.track_id || ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Evidence */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                {alert.evidence_image && (
                  <button
                    onClick={() => setSelectedImage(alert.evidence_image || null)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-medium border border-[#E2E8F0]"
                    title="View Evidence Image"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    Evidence
                  </button>
                )}

                {alert.status === 'NEW' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-semibold border border-blue-200 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                )}

                {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}

                {alert.status !== 'DISMISSED' && (
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                    title="Dismiss alert"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Snapshot Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 max-w-xl w-full shadow-modal space-y-3">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
              <h3 className="card-heading text-[#0F172A]">Evidence Snapshot Inspection</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-xs font-bold"
              >
                &times; Close
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Evidence Capture"
              className="w-full max-h-[60vh] object-contain rounded-lg border border-[#E2E8F0] bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
