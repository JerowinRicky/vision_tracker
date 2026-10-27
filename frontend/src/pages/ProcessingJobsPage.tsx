import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  FileVideo,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { VideoUpload } from '../types';
import { useWebSocket } from '../contexts/WebSocketContext';

export const ProcessingJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<VideoUpload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { subscribe } = useWebSocket();

  const fetchJobs = () => {
    setLoading(true);
    api.get('/videos/')
      .then((res) => {
        const data: VideoUpload[] = res.data.results || res.data;
        setJobs(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();

    // Subscribe to live WebSocket progress updates
    const unsubProgress = subscribe('processing.progress', (data) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === data.video_id
            ? { ...j, status: data.status, progress_percent: data.progress }
            : j
        )
      );
    });

    const unsubCompleted = subscribe('processing.completed', (data) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === data.video_id
            ? { ...j, status: 'completed', progress_percent: 100, detected_objects_count: data.detected_objects }
            : j
        )
      );
    });

    const interval = setInterval(fetchJobs, 6000);
    return () => {
      unsubProgress();
      unsubCompleted();
      clearInterval(interval);
    };
  }, []);

  const handlePause = async (id: number) => {
    try {
      await api.post(`/videos/${id}/pause/`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async (id: number) => {
    try {
      await api.post(`/videos/${id}/resume/`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/videos/${id}/cancel/`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const activeJobs = jobs.filter((j) => j.status === 'processing').length;
  const queuedJobs = jobs.filter((j) => j.status === 'queued').length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            AI Inference Task Pipeline
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Real-time Celery worker status, batch queue execution, & live frame processing progress
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Active Processing</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{activeJobs}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Queued In Line</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{queuedJobs}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Completed Inferences</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{completedJobs}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Errors / Failed</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{failedJobs}</span>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-sm">
          <Cpu className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="text-[16px] font-semibold text-[#0F172A]">No Inference Jobs in Queue</h3>
          <p className="text-[13px] text-[#64748B] mt-1 max-w-sm mx-auto">
            Upload recorded surveillance videos or attach live camera feeds to start automated YOLO tracking tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F172A] text-[15px]">{job.original_filename}</h3>
                      <span className="text-[12px] font-mono text-[#64748B] block">
                        Task ID: {job.task_id || `job-${job.id}`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                      job.status === 'completed'
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : job.status === 'processing'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] animate-pulse'
                        : job.status === 'queued'
                        ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                        : job.status === 'failed'
                        ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[12px] text-[#64748B] font-mono">
                    <span className="font-medium text-[#0F172A]">Pipeline Execution</span>
                    <span className="font-bold text-[#0F172A]">{job.progress_percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        job.status === 'completed'
                          ? 'bg-[#16A34A]'
                          : job.status === 'failed'
                          ? 'bg-[#DC2626]'
                          : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${job.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Details */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#E2E8F0] text-[13px]">
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase font-mono block">Frames</span>
                    <span className="font-semibold text-[#0F172A]">
                      {job.processed_frames} / {job.total_frames || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase font-mono block">FPS Target</span>
                    <span className="font-semibold text-[#0F172A]">{job.fps} FPS</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase font-mono block">Objects Indexed</span>
                    <span className="font-bold text-[#2563EB]">{job.detected_objects_count} entities</span>
                  </div>
                </div>

                {job.error_message && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px]">
                    {job.error_message}
                  </div>
                )}
              </div>

              {/* Controls Footer */}
              <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[12px]">
                <span className="text-[#64748B]">
                  Created: {new Date(job.created_at).toLocaleTimeString()}
                </span>

                <div className="flex items-center gap-2">
                  {job.status === 'processing' && (
                    <button
                      onClick={() => handlePause(job.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center gap-1 font-medium transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  )}

                  {job.status === 'paused' && (
                    <button
                      onClick={() => handleResume(job.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 font-medium shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Resume
                    </button>
                  )}

                  {['processing', 'queued'].includes(job.status) && (
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] flex items-center gap-1 font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
