import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  FileText,
  FileSpreadsheet,
  Clock,
  Users,
  Car,
  Activity,
  CheckCircle,
  RefreshCw,
  Eye,
  Filter,
  Sparkles,
  MapPin,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { Report } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReportsList = () => {
    api.get('/reports/')
      .then((res) => {
        const data = res.data.results || res.data;
        setReports(data);
        if (data.length > 0 && !currentReport) {
          setCurrentReport(data[0]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let resp;
      if (reportType === 'daily') {
        resp = await api.get(`/reports/daily/?date=${selectedDate}&export_format=${exportFormat}`);
      } else if (reportType === 'weekly') {
        resp = await api.get(`/reports/weekly/?export_format=${exportFormat}`);
      } else if (reportType === 'monthly') {
        resp = await api.get(`/reports/monthly/?export_format=${exportFormat}`);
      } else {
        resp = await api.post('/reports/', {
          report_type: 'custom',
          title: `Custom Report (${selectedDate})`,
          start_date: selectedDate,
          end_date: selectedDate,
          file_format: exportFormat,
          filters_applied: {}
        });
      }
      setCurrentReport(resp.data);
      fetchReportsList();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'pdf' | 'csv' | 'excel') => {
    window.open(`/api/reports/daily/?date=${selectedDate}&export_format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-[#2563EB]" />
            Intelligence Reports & Audit Documentation
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Automated BI digests, peak occupancy summaries, and multi-format compliance exports
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            Export PDF
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
            Export CSV
          </button>
          <button
            onClick={() => handleDownload('excel')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-subtle text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Report Type selector */}
            <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
              {(['daily', 'weekly', 'monthly', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReportType(t)}
                  className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                    reportType === t
                      ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {t} Report
                </button>
              ))}
            </div>

            {/* Date input */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#94A3B8]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Compile Report
          </button>
        </div>
      </div>

      {/* Main Report Visual Sheet */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle space-y-6">
        {/* Document Header */}
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-blue-100">
              {reportType.toUpperCase()} INTELLIGENCE SUMMARY
            </span>
            <h2 className="text-xl font-bold text-[#0F172A] mt-1.5">
              VisionTrack AI CCTV Analytics Digest
            </h2>
            <p className="text-xs text-[#64748B]">Target Date: {selectedDate} &bull; Generated for Security & Operations</p>
          </div>

          <div className="text-right text-xs font-mono text-[#64748B]">
            <div>Document Ref: VT-RPT-{selectedDate.replace(/-/g, '')}</div>
            <div>Classification: Internal Security Use</div>
          </div>
        </div>

        {/* Executive Summary Metrics Grid (Section 20 requirement) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-[11px] font-medium text-[#64748B] block">Unique Objects</span>
            <div className="text-xl font-bold text-[#0F172A] mt-0.5">148</div>
            <span className="text-[10px] text-[#2563EB] font-medium">+12% vs prior cycle</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-[11px] font-medium text-[#64748B] block">Total Visits Logged</span>
            <div className="text-xl font-bold text-[#0F172A] mt-0.5">237</div>
            <span className="text-[10px] text-[#2563EB] font-medium">14.2 min avg dwell</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-[11px] font-medium text-[#64748B] block">Vehicles Ingested</span>
            <div className="text-xl font-bold text-[#7C3AED] mt-0.5">72</div>
            <span className="text-[10px] text-[#7C3AED] font-medium">Parking deck active</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-[11px] font-medium text-[#64748B] block">Peak Traffic Period</span>
            <div className="text-xl font-bold text-[#0F172A] mt-0.5">10:00 - 11:00</div>
            <span className="text-[10px] text-[#64748B] font-medium">115 visitors/hr</span>
          </div>
        </div>

        {/* Breakdown Sections: People, Vehicles, Camera Activity, Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Camera Activity Breakdown */}
          <div className="border border-[#E2E8F0] rounded-lg p-4 bg-white">
            <h3 className="card-heading text-[#0F172A] mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2563EB]" />
              Camera Ingestion Activity
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2">Camera</th>
                  <th className="py-2">Total Visits</th>
                  <th className="py-2 text-right">Security Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="py-2 font-medium">CAM-01 (Entrance)</td>
                  <td className="py-2 font-mono">124</td>
                  <td className="py-2 text-right font-mono text-amber-600">3</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">CAM-02 (Parking)</td>
                  <td className="py-2 font-mono">87</td>
                  <td className="py-2 text-right font-mono text-emerald-600">1</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">CAM-03 (Warehouse)</td>
                  <td className="py-2 font-mono">52</td>
                  <td className="py-2 text-right font-mono text-rose-600">2</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">CAM-04 (Perimeter)</td>
                  <td className="py-2 font-mono">19</td>
                  <td className="py-2 text-right font-mono text-[#64748B]">0</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Spatial Geofences & Dwell Summary */}
          <div className="border border-[#E2E8F0] rounded-lg p-4 bg-white">
            <h3 className="card-heading text-[#0F172A] mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7C3AED]" />
              Spatial Zones & Security Violations
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2">Zone Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Breaches / Dwell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="py-2 font-medium">Restricted Vault Corridor</td>
                  <td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Restricted</span></td>
                  <td className="py-2 text-right font-mono text-rose-600 font-bold">2 Breaches</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Main Lobby Entrance</td>
                  <td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Entrance</span></td>
                  <td className="py-2 text-right font-mono text-emerald-600">Nominal</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Warehouse Loading Deck</td>
                  <td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Warehouse</span></td>
                  <td className="py-2 text-right font-mono text-amber-600">1 Loitering</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
          Generated automatically by VisionTrack AI &bull; Certified for Regulatory & Physical Security Audit Trails
        </div>
      </div>
    </div>
  );
};
