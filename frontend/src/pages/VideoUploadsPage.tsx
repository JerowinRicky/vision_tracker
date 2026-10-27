import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileVideo,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Cpu,
  RefreshCw,
  HardDrive,
  Camera as CameraIcon,
  Search,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { VideoUpload, Camera } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const VideoUploadsPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { isOperator } = useAuth();
  const navigate = useNavigate();

  const fetchVideos = () => {
    setLoading(true);
    api.get('/videos/')
      .then((res) => setVideos(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchCameras = () => {
    api.get('/cameras/')
      .then((res) => setCameras(res.data.results || res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchVideos();
    fetchCameras();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedCamera) {
      formData.append('camera', String(selectedCamera));
    }

    try {
      await api.post('/videos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchVideos();
    } catch (err: any) {
      setUploadProgress(null);
      const data = err.response?.data;
      let msg = 'Upload failed. Ensure video is MP4/AVI/MKV/MOV and under 500MB.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.file?.[0]) {
        msg = data.file[0];
      } else if (data?.error) {
        msg = data.error;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data && typeof data === 'object') {
        const firstVal = Object.values(data)[0];
        if (Array.isArray(firstVal) && firstVal[0]) msg = String(firstVal[0]);
        else if (firstVal) msg = String(firstVal);
      }
      setUploadError(msg);
    }
  };

  const handleStartProcessing = async (id: number) => {
    try {
      await api.post(`/videos/${id}/process/`);
      fetchVideos();
      navigate('/jobs');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start video processing job.');
    }
  };

  const handleDelete = async (id: number, filename: string) => {
    if (!window.confirm(`Delete recorded video "${filename}"?`)) return;
    try {
      await api.delete(`/videos/${id}/`);
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  };

  const completedVideos = videos.filter((v) => v.status === 'completed').length;
  const processingVideos = videos.filter((v) => v.status === 'processing').length;
  const totalObjectsDetected = videos.reduce((acc, v) => acc + (v.detected_objects_count || 0), 0);

  const filteredVideos = videos.filter((v) =>
    v.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Recorded Video Analysis
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Upload offline surveillance footage for automated YOLO tracking, Re-ID indexing, & visitor grouping
          </p>
        </div>

        <button
          onClick={fetchVideos}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Footage
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <FileVideo className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Total Videos</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{videos.length}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Completed Analysis</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{completedVideos}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Active Processing</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{processingVideos}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Objects Indexed</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{totalObjectsDetected}</span>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      {isOperator && (
        <div className="bg-white border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-xl p-8 text-center transition-all group shadow-sm">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".mp4,.avi,.mkv,.mov"
            className="hidden"
            id="video-upload-input"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <label
                htmlFor="video-upload-input"
                className="cursor-pointer text-[15px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                Click to upload surveillance video
              </label>
              <span className="text-[14px] text-[#64748B]"> or drag and drop</span>
              <p className="text-[12px] text-[#64748B] mt-1">
                Supported formats: MP4, AVI, MKV, MOV (maximum file size 500 MB)
              </p>
            </div>

            {/* Associate Camera */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[13px]">
              <span className="text-[#64748B] flex items-center gap-1">
                <CameraIcon className="w-3.5 h-3.5" /> Associate Camera:
              </span>
              <select
                value={selectedCamera || ''}
                onChange={(e) => setSelectedCamera(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Default (Offline / Recorded Video)</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.camera_id} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="pt-3 max-w-sm mx-auto">
                <div className="flex justify-between text-[12px] text-[#64748B] mb-1 font-mono">
                  <span>Uploading video stream...</span>
                  <span className="font-bold text-[#0F172A]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Videos List Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F8FAFC]">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">
            Stored Recorded Footage ({filteredVideos.length})
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name..."
              className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Video File</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Analysis Status</th>
                <th className="py-3 px-4">Objects Found</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[14px] text-[#64748B]">
                    No recorded videos uploaded yet. Upload an MP4 video above to run AI processing.
                  </td>
                </tr>
              ) : (
                filteredVideos.map((vid) => (
                  <tr key={vid.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                          <FileVideo className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-[#0F172A] block text-[14px]">
                            {vid.original_filename}
                          </span>
                          <span className="text-[12px] text-[#64748B] font-mono">
                            {vid.fps} FPS &bull; {vid.resolution || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[13px] text-[#64748B]">
                      {(vid.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </td>

                    <td className="py-3.5 px-4 text-[13px] text-[#64748B] font-mono">
                      {new Date(vid.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                          vid.status === 'completed'
                            ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                            : vid.status === 'processing'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] animate-pulse'
                            : vid.status === 'queued'
                            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                            : vid.status === 'failed'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          vid.status === 'completed' ? 'bg-[#16A34A]' :
                          vid.status === 'processing' ? 'bg-[#2563EB]' :
                          vid.status === 'queued' ? 'bg-[#D97706]' : 'bg-[#64748B]'
                        }`} />
                        {vid.status.toUpperCase()}
                        {vid.status === 'processing' && ` (${vid.progress_percent}%)`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[13px]">
                      {vid.detected_objects_count > 0 ? (
                        <span className="font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                          {vid.detected_objects_count} unique
                        </span>
                      ) : (
                        <span className="text-[#64748B]">&mdash;</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isOperator && vid.status === 'uploaded' && (
                          <button
                            onClick={() => handleStartProcessing(vid.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium shadow-sm transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            Start AI Pipeline
                          </button>
                        )}

                        {vid.status === 'completed' && (
                          <button
                            onClick={() => navigate('/objects')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] text-[12px] font-medium transition-colors"
                          >
                            View Objects <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {isOperator && (
                          <button
                            onClick={() => handleDelete(vid.id, vid.original_filename)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
