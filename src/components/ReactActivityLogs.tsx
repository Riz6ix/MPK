import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withTimeout } from '../lib/supabase';

interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
  ip_address: string | null;
  device_info: string | null;
  device_id: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  CREATE_MEMBER:   { label: 'Tambah Anggota',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  icon: 'ph-user-plus' },
  UPDATE_MEMBER:   { label: 'Edit Anggota',      color: 'text-blue-700 bg-blue-50 border-blue-200',           icon: 'ph-pencil-simple' },
  DELETE_MEMBER:   { label: 'Hapus Anggota',     color: 'text-red-700 bg-red-50 border-red-200',              icon: 'ph-user-minus' },
  CREATE_ALUMNI:   { label: 'Tambah Alumni',     color: 'text-purple-700 bg-purple-50 border-purple-200',     icon: 'ph-graduation-cap' },
  UPDATE_ALUMNI:   { label: 'Edit Alumni',       color: 'text-blue-700 bg-blue-50 border-blue-200',           icon: 'ph-pencil-simple' },
  DELETE_ALUMNI:   { label: 'Hapus Alumni',      color: 'text-red-700 bg-red-50 border-red-200',              icon: 'ph-trash' },
  CREATE_CLASS:    { label: 'Tambah Kelas',      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  icon: 'ph-plus-circle' },
  UPDATE_CLASS:    { label: 'Edit Kelas',        color: 'text-blue-700 bg-blue-50 border-blue-200',           icon: 'ph-pencil-simple' },
  DELETE_CLASS:    { label: 'Hapus Kelas',       color: 'text-red-700 bg-red-50 border-red-200',              icon: 'ph-trash' },
  SEED_CLASSES:    { label: 'Seed Kelas',        color: 'text-amber-700 bg-amber-50 border-amber-200',        icon: 'ph-database' },
  SYNC_CLASSES:    { label: 'Auto Sync Kelas',   color: 'text-amber-700 bg-amber-50 border-amber-200',        icon: 'ph-arrows-merge' },
  CREATE_POSITION: { label: 'Tambah Jabatan',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  icon: 'ph-push-pin' },
  UPDATE_POSITION: { label: 'Edit Jabatan',      color: 'text-blue-700 bg-blue-50 border-blue-200',           icon: 'ph-pencil-simple' },
  DELETE_POSITION: { label: 'Hapus Jabatan',     color: 'text-red-700 bg-red-50 border-red-200',              icon: 'ph-trash' },
};

const PAGE_SIZE = 50;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function parseDeviceInfo(ua: string | null): string {
  if (!ua) return '—';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    const match = ua.match(/\(Linux; Android [^;]+; ([^)]+)\)/);
    return match ? match[1].trim().substring(0, 30) : 'Android';
  }
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Mac/.test(ua)) return 'Mac';
  return ua.substring(0, 30) + '…';
}

// ─── Custom Action Dropdown — tema krem, bukan <select> native ─────────────
function ActionDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value ? ACTION_LABELS[value]?.label ?? value : 'Semua Aksi';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full sm:w-auto flex items-center justify-between gap-2 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-cream-500 transition cursor-pointer shadow-sm active:scale-[0.99] leading-normal min-w-[140px]"
      >
        <span className="truncate">{selected}</span>
        <i className={`ph-bold ${open ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-[10px] shrink-0`}></i>
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 mt-1.5 w-52 bg-[#fdf8f3] border border-cream-300 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-3.5 pt-3 pb-1.5">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">Filter Aksi</p>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-cream-100/60 pb-1.5">
            <div
              onClick={() => { onChange(''); setOpen(false); }}
              className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-xs font-bold ${
                value === ''
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-slate-600 hover:bg-cream-100/80 hover:text-slate-900'
              }`}
            >
              <span>Semua Aksi</span>
              {value === '' && <i className="ph-bold ph-check text-amber-600 text-[10px]"></i>}
            </div>

            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <div
                key={k}
                onClick={() => { onChange(k); setOpen(false); }}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer transition-colors text-xs ${
                  value === k
                    ? 'bg-amber-50 text-amber-800 font-bold'
                    : 'text-slate-600 hover:bg-cream-100/80 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <i className={`ph-bold ${v.icon} text-[11px] opacity-60`}></i>
                  {v.label}
                </span>
                {value === k && <i className="ph-bold ph-check text-amber-600 text-[10px] shrink-0"></i>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ReactActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [isLive, setIsLive] = useState(false);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterAction) query = query.eq('action', filterAction);
      if (filterEmail) query = query.ilike('admin_email', `%${filterEmail}%`);

      const { data, error, count } = await withTimeout(query, 10000, 'activity_logs');

      if (error) throw error;
      if (data) setLogs(data);
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      if (!silent) setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEmail]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime live-update
  useEffect(() => {
    if (!isLive) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const setupChannel = () => {
      channel = supabase
        .channel('activity-logs-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
          fetchLogs(true);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reconnectTimer = setTimeout(() => {
              if (channel) supabase.removeChannel(channel);
              setupChannel();
            }, 5000);
          }
        });
    };

    setupChannel();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [isLive, fetchLogs]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const exportCSV = () => {
    const header = ['Waktu', 'Admin', 'Aksi', 'Tipe Entitas', 'Detail', 'IP Address', 'Device', 'Device ID'];
    const rows = logs.map(l => [
      formatDate(l.created_at),
      l.admin_email,
      l.action,
      l.entity_type ?? '',
      l.detail ?? '',
      l.ip_address ?? '',
      parseDeviceInfo(l.device_info),
      l.device_id ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="cozy-paper-card p-5 border border-cream-300 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <i className="ph-duotone ph-clipboard-text text-amber-700 text-xl"></i>
              Riwayat Aktivitas Admin
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {totalCount} log tercatat · halaman {page + 1} dari {Math.max(1, totalPages)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live toggle */}
            <button
              onClick={() => setIsLive(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isLive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-cream-50 border-cream-300 text-slate-600 hover:border-amber-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isLive ? 'Live' : 'Live Off'}
            </button>
            <button
              onClick={() => fetchLogs()}
              className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              <i className="ph-bold ph-arrow-clockwise mr-1"></i>Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={logs.length === 0}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <i className="ph-bold ph-download-simple"></i> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Filter email admin..."
            value={filterEmail}
            onChange={e => { setFilterEmail(e.target.value); setPage(0); }}
            className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:outline-none focus:border-cream-500 transition font-medium leading-normal"
          />
          <ActionDropdown
            value={filterAction}
            onChange={(v) => { setFilterAction(v); setPage(0); }}
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="cozy-paper-card border border-cream-300 shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-700 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-mono">Memuat log aktivitas...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <i className="ph-duotone ph-wifi-slash text-4xl text-red-300"></i>
            <div className="text-center">
              <p className="text-slate-700 text-sm font-bold">Gagal memuat log</p>
              <p className="text-slate-400 text-xs font-mono mt-1 max-w-xs">{fetchError}</p>
            </div>
            <button onClick={() => fetchLogs()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-2">
              <i className="ph-bold ph-arrow-clockwise"></i> Coba Lagi
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <i className="ph-duotone ph-clipboard-text text-5xl text-cream-300"></i>
            <p className="text-slate-500 text-sm font-medium">Belum ada log aktivitas.</p>
            <p className="text-slate-400 text-xs font-mono">Log akan otomatis muncul setelah ada operasi admin.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-cream-50/80 border-b border-cream-200">
                  <tr className="text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Admin</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Detail</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {logs.map(log => {
                    const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: 'ph-activity' };
                    return (
                      <tr key={log.id} className="hover:bg-cream-50/60 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[10px]">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 truncate max-w-[160px]" title={log.admin_email}>
                            {log.admin_email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold font-mono ${meta.color}`}>
                            <i className={`ph-bold ${meta.icon}`}></i>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[220px] whitespace-normal break-words" title={log.detail ?? ''}>
                          {log.detail || <span className="text-slate-300 font-mono">—</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                          {log.ip_address || '—'}
                        </td>
                        <td className="py-3 px-4 text-[10px] text-slate-500 max-w-[140px] truncate" title={log.device_info ?? ''}>
                          {parseDeviceInfo(log.device_info)}
                          {log.device_id && (
                            <div className="font-mono text-[8px] text-slate-300 mt-0.5 truncate" title={log.device_id}>
                              ID: {log.device_id.substring(0, 12)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-cream-100">
              {logs.map(log => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: 'ph-activity' };
                return (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold font-mono ${meta.color}`}>
                        <i className={`ph-bold ${meta.icon}`}></i>
                        {meta.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{formatDate(log.created_at)}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 break-words">{log.detail || '—'}</div>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-slate-400 flex-wrap">
                      <span className="truncate max-w-[130px] inline-block align-bottom" title={log.admin_email}>👤 {log.admin_email}</span>
                      {log.ip_address && <span>🌐 {log.ip_address}</span>}
                      <span className="truncate max-w-[120px] inline-block align-bottom">📱 {parseDeviceInfo(log.device_info)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-cream-200 flex items-center justify-between bg-cream-50/50">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40 cursor-pointer transition"
                >
                  ← Sebelumnya
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  Halaman {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40 cursor-pointer transition"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
