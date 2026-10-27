import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Camera,
  Activity,
  Shield,
  Layers,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  GitCommit,
  CheckCircle2,
  LogOut,
  LogIn,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { PersistentObject } from '../types';

interface TimelineEvent {
  timestamp: string;
  time_display: string;
  event_type: string;
  title: string;
  description: string;
  camera_id: string;
  badge: string;
  badge_color: string;
}

export const ObjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [object, setObject] = useState<PersistentObject | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/objects/${id}/`),
        api.get(`/objects/${id}/timeline/`)
      ])
        .then(([objRes, timelineRes]) => {
          setObject(objRes.data);
          setTimeline(timelineRes.data.timeline || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !object) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getImageUrl = (obj: any) => {
    if (obj.primary_image_url) return obj.primary_image_url;
    if (!obj.primary_evidence_image) return '';
    const cleanPath = obj.primary_evidence_image.replace(/\\/g, '/');
    if (cleanPath.startsWith('/media/')) return cleanPath;
    if (cleanPath.startsWith('evidence/')) return `/media/${cleanPath}`;
    return `/media/evidence/${cleanPath}`;
  };

  const getEvidenceImageUrl = (ev: any) => {
    if (ev.image_url) return ev.image_url;
    if (ev.image) {
      const cleanPath = ev.image.replace(/\\/g, '/');
      if (cleanPath.startsWith('/media/')) return cleanPath;
      return `/media/${cleanPath}`;
    }
    return '';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back button */}
      <Link
        to="/objects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tracked Objects Directory
      </Link>

      {/* Hero Header Card (Section 18 requirement) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle flex flex-col md:flex-row gap-6 items-start">
        {/* Main Evidence Photo */}
        <div className="w-40 h-40 rounded-xl bg-slate-900 border border-[#E2E8F0] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-subtle relative group">
          {getImageUrl(object) ? (
            <img
              src={getImageUrl(object)}
              alt={object.internal_id}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-slate-500" />
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white">
            Primary Evidence
          </div>
        </div>

        {/* Identity Attributes */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono text-[#2563EB] uppercase tracking-wider block font-semibold">
                Persistent AI Identity
              </span>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {object.internal_id}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-blue-100 text-xs font-bold uppercase tracking-wider">
                {object.object_type}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#F5F3FF] text-[#7C3AED] border border-purple-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Likely ReID Match
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
            <div>
              <span className="text-[11px] text-[#64748B] block">First Seen</span>
              <strong className="text-xs font-semibold text-[#0F172A]">
                {new Date(object.first_seen).toLocaleDateString()} {new Date(object.first_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-[#64748B] block">Last Seen</span>
              <strong className="text-xs font-semibold text-[#0F172A]">
                {new Date(object.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-[#64748B] block">Visit Count</span>
              <strong className="text-xs font-bold text-[#2563EB]">
                {object.total_visits} session{object.total_visits > 1 ? 's' : ''}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-[#64748B] block">Total Duration</span>
              <strong className="text-xs font-semibold text-[#0F172A] font-mono">
                {formatDuration(object.total_duration_seconds)}
              </strong>
            </div>
          </div>

          {/* Associated Cameras & Zones */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#64748B]">Cameras:</span>
            <div className="flex gap-1.5 flex-wrap">
              {object.cameras?.map((cam) => (
                <span key={cam.id} className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[#0F172A] font-mono text-[11px] border border-[#E2E8F0]">
                  {cam.camera_id} ({cam.name})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Camera Journey Timeline & Evidence Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unified Visual Journey Timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-heading text-[#0F172A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              Cross-Camera Movement Timeline
            </h2>
            <span className="text-xs font-mono text-[#64748B]">
              {timeline.length} trajectory events
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] max-h-[460px] overflow-y-auto pr-2">
            {timeline.length > 0 ? (
              timeline.map((ev, idx) => (
                <div key={idx} className="relative group text-xs">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  </span>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#0F172A]">{ev.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#2563EB] border border-blue-100">
                        {ev.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B]">{ev.description}</p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#94A3B8]">
                      <span>{ev.time_display}</span>
                      <span>&bull;</span>
                      <span>{ev.camera_id}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B]">No cross-camera events recorded yet.</p>
            )}
          </div>
        </div>

        {/* Evidence Images Gallery */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-heading text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Evidence Images Gallery
            </h2>
            <span className="text-xs font-mono text-[#64748B]">
              {object.evidence_images?.length || 0} captures
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {object.evidence_images && object.evidence_images.length > 0 ? (
              object.evidence_images.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {getEvidenceImageUrl(ev) ? (
                      <img
                        src={getEvidenceImageUrl(ev)}
                        alt="Evidence Capture"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    )}

                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
                      {ev.camera_id || 'OFFLINE-REC'}
                    </div>
                  </div>

                  <div className="p-2.5 text-xs">
                    <span className="font-semibold text-[#0F172A] block truncate capitalize">
                      {ev.event_type.replace('_', ' ')}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-[#64748B] mt-1 font-mono">
                      <span>Conf: {Math.round(ev.confidence * 100)}%</span>
                      {ev.similarity_score > 0 && (
                        <span className="text-[#7C3AED] font-semibold">
                          Sim: {Math.round(ev.similarity_score * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-xs text-[#64748B]">
                No extra evidence captures stored for this identity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
