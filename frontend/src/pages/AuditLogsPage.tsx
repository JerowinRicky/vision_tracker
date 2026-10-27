import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Shield,
  Clock,
  User,
  Terminal,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    const params: any = {};
    if (searchAction) params.action = searchAction;
    if (selectedResource) params.resource_type = selectedResource;

    api.get('/audit/', { params })
      .then((res) => setLogs(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedResource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleReset = () => {
    setSearchAction('');
    setSelectedResource('');
    api.get('/audit/')
      .then((res) => setLogs(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const settingsLogs = logs.filter((l) => l.resource_type === 'settings').length;
  const videoLogs = logs.filter((l) => l.resource_type === 'video').length;
  const cameraLogs = logs.filter((l) => l.resource_type === 'camera').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Immutable chronological audit trail tracing user actions, parameter adjustments, and video pipeline operations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Total Logged Events</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{logs.length}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Video Operations</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{videoLogs}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Camera Operations</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{cameraLogs}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Config Adjustments</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{settingsLogs}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              placeholder="Search action (e.g. SETTINGS_UPDATED, VIDEO_PROCESSED)..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
            >
              <option value="">All Resource Types</option>
              <option value="settings">Settings & AI Thresholds</option>
              <option value="video">Recorded Video Pipeline</option>
              <option value="camera">Camera Management</option>
              <option value="zone">Spatial Zones</option>
              <option value="user">User Accounts</option>
              <option value="report">Intelligence Reports</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 bg-white hover:bg-[#F8FAFC] text-[#64748B] text-[13px] font-medium rounded-lg border border-[#E2E8F0] transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-[13px] text-[#64748B]">
            Showing <strong className="text-[#0F172A] font-semibold">{logs.length}</strong> logged audit records
          </span>
          <span className="text-[12px] font-mono text-[#64748B]">
            Cryptographically chained &bull; Tamper-evident
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Details Payload</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[14px] text-[#64748B]">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-4 text-[13px] font-mono text-[#64748B] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold flex items-center justify-center">
                          {(log.username || 'SYS').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#0F172A] text-[13px]">
                          {log.username || 'System Engine'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        log.action.includes('UPDATE') || log.action.includes('MODIFY')
                          ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                          : log.action.includes('CREATE') || log.action.includes('PROCESSED')
                          ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                          : log.action.includes('DELETE') || log.action.includes('REMOVE')
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[13px] capitalize text-[#0F172A]">
                      <span className="font-medium">{log.resource_type}</span>{' '}
                      {log.resource_id && (
                        <span className="text-[#64748B] font-mono text-[12px]">(#{log.resource_id})</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[13px] font-mono text-[#64748B]">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Detail Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Audit Record Inspector</h3>
                  <p className="text-[12px] font-mono text-[#64748B]">Log ID: #{inspectLog.id} &bull; {inspectLog.action}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-[#64748B] block">Operator:</span>
                <span className="font-semibold text-[#0F172A]">{inspectLog.username || 'System'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Client IP:</span>
                <span className="font-mono text-[#0F172A]">{inspectLog.ip_address || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Resource:</span>
                <span className="capitalize font-medium text-[#0F172A]">{inspectLog.resource_type} (#{inspectLog.resource_id})</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Timestamp:</span>
                <span className="font-mono text-[#0F172A]">{new Date(inspectLog.timestamp).toISOString()}</span>
              </div>
            </div>

            <div>
              <span className="text-[12px] font-semibold text-[#0F172A] block mb-1">Payload JSON</span>
              <pre className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[12px] font-mono text-[#0F172A] overflow-x-auto max-h-60">
                {JSON.stringify(inspectLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium shadow-sm transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
