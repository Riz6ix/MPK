import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Member {
  id: string;
  name: string;
  class: string;
  status: string;
  position: string;
  avatar_url?: string | null;
}

export default function ReactClassManager() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Tab for Monitoring: 'ALL', 'X', 'XI', 'XII'
  const [activeTab, setActiveTab] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('X');
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('classes-members-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        () => {
          fetchClassesOnly();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          fetchMembersOnly();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Show status alerts then fade
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil data kelas secara spesifik beserta profil anggota aktif untuk rekap
      const [classRes, memberRes] = await Promise.all([
        supabase.from('classes').select('id, name, grade, order_index, is_active, created_at, updated_at').order('grade', { ascending: false }).order('order_index', { ascending: true }),
        supabase.from('members').select('id, name, class, status, position, avatar_url').eq('status', 'Aktif')
      ]);

      if (classRes.error) throw classRes.error;
      if (memberRes.error) throw memberRes.error;

      if (classRes.data) setClasses(classRes.data);
      if (memberRes.data) setMembers(memberRes.data);
    } catch (err: any) {
      setErrorMessage('Gagal mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesOnly = async () => {
    try {
      // Ambil data kelas dengan kolom spesifik
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade, order_index, is_active, created_at, updated_at')
        .order('grade', { ascending: false })
        .order('order_index', { ascending: true });
      if (error) throw error;
      if (data) setClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchMembersOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, class, status, position, avatar_url')
        .eq('status', 'Aktif');
      if (error) throw error;
      if (data) setMembers(data);
    } catch (err: any) {
      console.error('Error fetching members:', err);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setGrade('X');
    setOrderIndex(classes.filter(c => c.grade === 'X').length + 1);
    setIsActive(true);
    setErrorMessage(null);
  };

  // Set orderIndex based on selected grade
  useEffect(() => {
    if (!editingId) {
      const count = classes.filter(c => c.grade === grade).length;
      setOrderIndex(count + 1);
    }
  }, [grade, classes, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formattedName = name.trim().toUpperCase();

    const payload = {
      name: formattedName,
      grade,
      order_index: orderIndex,
      is_active: isActive,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setSuccessMessage(`Aman, kelas ${formattedName} diperbarui.`);
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([payload]);
        if (error) throw error;
        setSuccessMessage(`Selesai, kelas ${formattedName} ditambahkan.`);
      }
      handleReset();
      fetchClassesOnly();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan kelas: ' + (err.code === '23505' ? 'Nama kelas sudah terdaftar!' : err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cls: ClassItem) => {
    setEditingId(cls.id);
    setName(cls.name);
    setGrade(cls.grade);
    setOrderIndex(cls.order_index);
    setIsActive(cls.is_active);
    
    // Scroll smoothly to form card
    const formCard = document.getElementById('class-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('class-name-input');
      if (nameInput) setTimeout(() => nameInput.focus(), 300);
    }
  };

  const handleDelete = (cls: ClassItem) => {
    const confirmDelete = (window as any).showCozyConfirm;
    if (confirmDelete) {
      confirmDelete(
        'Hapus Kelas',
        `Hapus kelas ${cls.name}? Ga bisa balik lagi ya.`,
        async () => {
          try {
            const { error } = await supabase
              .from('classes')
              .delete()
              .eq('id', cls.id);
            if (error) throw error;
            setSuccessMessage(`Selesai, kelas ${cls.name} dihapus.`);
            fetchClassesOnly();
          } catch (err: any) {
            setErrorMessage('Gagal menghapus kelas: ' + err.message);
          }
        }
      );
    } else {
      // Fallback native confirm if custom dialog not bound
      if (window.confirm(`Hapus kelas ${cls.name}?`)) {
        (async () => {
          try {
            const { error } = await supabase
              .from('classes')
              .delete()
              .eq('id', cls.id);
            if (error) throw error;
            setSuccessMessage(`Selesai, kelas ${cls.name} dihapus.`);
            fetchClassesOnly();
          } catch (err: any) {
            setErrorMessage('Gagal menghapus kelas: ' + err.message);
          }
        })();
      }
    }
  };

  // Seed 31 Default Classes
  const handleSeedDefaults = async () => {
    const triggerConfirm = (window as any).showCozyConfirm;
    const runSeed = async () => {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const defaultClasses: any[] = [];
        
        // X-E1 to X-E11
        for (let i = 1; i <= 11; i++) {
          defaultClasses.push({ name: `X-E${i}`, grade: 'X', order_index: i, is_active: true });
        }
        // XI-F1 to XI-F10
        for (let i = 1; i <= 10; i++) {
          defaultClasses.push({ name: `XI-F${i}`, grade: 'XI', order_index: i, is_active: true });
        }
        // XII-F1 to XII-F10
        for (let i = 1; i <= 10; i++) {
          defaultClasses.push({ name: `XII-F${i}`, grade: 'XII', order_index: i, is_active: true });
        }

        // Check if there are existing classes
        if (classes.length > 0) {
          // Delete existing classes first
          const { error: delError } = await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (delError) throw delError;
        }

        const { error } = await supabase.from('classes').insert(defaultClasses);
        if (error) throw error;

        setSuccessMessage('Selesai, 31 kelas default udah dibuat.');
        fetchData();
      } catch (err: any) {
        setErrorMessage('Gagal membuat kelas default: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (triggerConfirm) {
      triggerConfirm(
        'Seed Kelas Default',
        'Seed kelas default? Ini bakal nimpa data kelas yang lama ya.',
        runSeed
      );
    } else {
      if (window.confirm('Hapus dan ganti kelas dengan 31 kelas default?')) {
        runSeed();
      }
    }
  };

  // Sync classes from existing members
  const handleSyncFromMembers = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // Get unique classes from members table
      const { data: memberClasses, error: mError } = await supabase
        .from('members')
        .select('class');
      if (mError) throw mError;

      if (!memberClasses || memberClasses.length === 0) {
        setErrorMessage('Tidak ada data anggota untuk disinkronkan.');
        setLoading(false);
        return;
      }

      const uniqueClassNames = Array.from(new Set(memberClasses.map(m => m.class.trim().toUpperCase()))).filter(Boolean);
      const existingClassNames = classes.map(c => c.name.toUpperCase());
      
      const newClassesToInsert = uniqueClassNames.filter(name => !existingClassNames.includes(name));

      if (newClassesToInsert.length === 0) {
        setSuccessMessage('Daftar kelas sudah sepenuhnya sinkron dengan data anggota.');
        setLoading(false);
        return;
      }

      const inserts = newClassesToInsert.map(name => {
        // Determine grade from name prefix e.g. "XII-F5" -> grade "XII", "X-F1" -> grade "X", "XI-F3" -> grade "XI"
        let inferredGrade = 'X';
        if (name.startsWith('XII')) inferredGrade = 'XII';
        else if (name.startsWith('XI')) inferredGrade = 'XI';

        const gradeCount = classes.filter(c => c.grade === inferredGrade).length;

        return {
          name,
          grade: inferredGrade,
          order_index: gradeCount + 1,
          is_active: true
        };
      });

      const { error: insError } = await supabase.from('classes').insert(inserts);
      if (insError) throw insError;

      setSuccessMessage(`Selesai, ${newClassesToInsert.length} kelas diimpor dari data anggota.`);
      fetchData();
    } catch (err: any) {
      setErrorMessage('Gagal menyinkronkan kelas dari anggota: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Statistics calculation
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.is_active).length;
  
  // Find which active classes have at least one active MPK member
  const representedClassNames = Array.from(new Set(members.map(m => m.class.toUpperCase())));
  const classesWithMPK = classes.filter(c => c.is_active && representedClassNames.includes(c.name.toUpperCase()));
  const classesWithoutMPK = classes.filter(c => c.is_active && !representedClassNames.includes(c.name.toUpperCase()));

  const representedCount = classesWithMPK.length;
  const emptyCount = classesWithoutMPK.length;
  const totalActiveMPKMembers = members.length;

  // Grade ordering maps for sorting visual tabs
  const gradeOrderMap: Record<string, number> = { 'XII': 3, 'XI': 2, 'X': 1 };
  
  // Filter classes according to activeTab
  const filteredClasses = classes.filter(cls => {
    if (activeTab === 'ALL') return true;
    return cls.grade === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* 1. Alerts Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <i className="ph-bold ph-check-circle text-emerald-600 text-base"></i>
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <i className="ph-bold ph-warning-circle text-red-600 text-base"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Stats Dashboard Overview (Cozy cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="cozy-paper-card p-3 sm:p-4 border border-cream-300 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
            <i className="ph-duotone ph-squares-four text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider truncate">Total Kelas</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono leading-tight">{totalClasses}</div>
            <div className="text-[9px] font-medium text-slate-500 font-mono mt-0.5">{activeClasses} Aktif</div>
          </div>
        </div>

        <div className="cozy-paper-card p-3 sm:p-4 border border-cream-300 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-800 shrink-0">
            <i className="ph-duotone ph-users-three text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider truncate">Terwakili</div>
            <div className="text-lg sm:text-xl font-black text-emerald-950 font-mono leading-tight">{representedCount}</div>
            <div className="text-[9px] font-medium text-emerald-700 font-mono mt-0.5">Kelas</div>
          </div>
        </div>

        <div className="cozy-paper-card p-3 sm:p-4 border border-cream-300 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-800 shrink-0">
            <i className="ph-duotone ph-warning-octagon text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider truncate">Belum Ada</div>
            <div className="text-lg sm:text-xl font-black text-rose-950 font-mono leading-tight">{emptyCount}</div>
            <div className="text-[9px] font-medium text-rose-700 font-mono mt-0.5">Kelas</div>
          </div>
        </div>

        <div className="cozy-paper-card p-3 sm:p-4 border border-cream-300 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-800 shrink-0">
            <i className="ph-duotone ph-identification-badge text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider truncate">Pengurus</div>
            <div className="text-lg sm:text-xl font-black text-blue-950 font-mono leading-tight">{totalActiveMPKMembers}</div>
            <div className="text-[9px] font-medium text-blue-700 font-mono mt-0.5">Anak Aktif</div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Form & Utilities (Moved to bottom on mobile for better viewing order) */}
        <div className="space-y-6 lg:col-span-1 order-2 lg:order-1">
          {/* Class Editor Form */}
          <div id="class-form-card" className="cozy-paper-card p-5 border border-cream-300 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <i className={`ph-bold ${editingId ? 'ph-pencil-simple' : 'ph-plus-circle'} text-amber-600 text-base`}></i>
                {editingId ? 'Edit Detail Kelas' : 'Tambah Kelas Baru'}
              </h3>
              {editingId && (
                <button 
                  onClick={handleReset}
                  className="text-[10px] font-bold font-mono text-slate-400 hover:text-slate-600 transition"
                >
                  BATAL
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Nama Kelas</label>
                <input 
                  id="class-name-input"
                  type="text" 
                  required
                  placeholder="Contoh: X-F12 / XII-F1"
                  className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition font-medium uppercase leading-normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Tingkatan</label>
                  <select 
                    className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-cream-500 transition font-medium leading-normal"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="X">Tingkat X (10)</option>
                    <option value="XI">Tingkat XI (11)</option>
                    <option value="XII">Tingkat XII (12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Urutan (Index)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-cream-500 transition font-medium font-mono leading-normal"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input 
                  type="checkbox" 
                  id="is-active-checkbox"
                  className="w-4 h-4 rounded border-cream-300 text-amber-600 focus:ring-amber-500/20 cursor-pointer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="is-active-checkbox" className="select-none font-semibold text-slate-700 cursor-pointer font-mono text-[10px] uppercase tracking-wider">
                  Tampilkan di Form Publik (Aktif)
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl transition hover:bg-slate-800 shadow cursor-pointer text-center text-xs font-mono uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Perbarui Kelas' : 'Simpan Kelas')}
              </button>
            </form>
          </div>

          {/* Quick Admin Actions Panel */}
          <div className="cozy-paper-card p-5 border border-cream-300 shadow-md space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono pb-3 border-b border-cream-200">
              Aksi Administratif Cepat
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleSyncFromMembers}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-cream-300 hover:border-amber-400 hover:bg-amber-50/10 text-slate-700 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <i className="ph-bold ph-arrows-merge text-amber-600 text-base"></i>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Auto Sync dari Anggota</div>
                    <div className="text-[9px] text-slate-400">Impor kelas baru yang ada di data anggota</div>
                  </div>
                </div>
                <i className="ph-bold ph-caret-right text-slate-400 text-sm"></i>
              </button>

              <button 
                onClick={handleSeedDefaults}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-cream-300 hover:border-red-400 hover:bg-red-50/10 text-slate-700 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <i className="ph-bold ph-database text-rose-600 text-base"></i>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Seed 31 Kelas Default</div>
                    <div className="text-[9px] text-slate-400">Ganti data dengan X-E1 s/d XII-F10</div>
                  </div>
                </div>
                <i className="ph-bold ph-caret-right text-slate-400 text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Cozy Monitoring Panel (Show first on mobile) */}
        <div className="space-y-6 lg:col-span-2 order-1 lg:order-2">
          <div className="cozy-paper-card p-5 border border-cream-300 shadow-md space-y-5">
            {/* Header and Level Selector Tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-4">
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    Dashboard Sebaran Anggota MPK
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Memantau keterwakilan siswa per kelas secara real-time</p>
                </div>
                {/* Minimize / Expand Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Expand Panel Sebaran" : "Minimize Panel Sebaran"}
                  className="p-2 bg-cream-100/50 hover:bg-cream-200 border border-cream-300 text-slate-500 hover:text-amber-800 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 self-center"
                >
                  <i className={`ph-bold ${isCollapsed ? 'ph-caret-down' : 'ph-caret-up'} text-xs`}></i>
                </button>
              </div>

              {/* level filter tabs with smooth transition */}
              <div className={`transition-all duration-300 ease-in-out flex bg-cream-100 p-1 rounded-xl border border-cream-200 self-start text-[10px] font-bold font-mono ${
                isCollapsed 
                  ? 'opacity-0 scale-95 pointer-events-none max-w-0 max-h-0 overflow-hidden p-0 border-0' 
                  : 'opacity-100 scale-100 max-w-[500px]'
              }`}>
                {(['ALL', 'X', 'XI', 'XII'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-white text-amber-800 shadow-sm border border-cream-300/40'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="hidden sm:inline">Tingkat </span>{tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Content Wrapper with Smooth Sliding Transitions */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
              isCollapsed 
                ? 'max-h-0 opacity-0 pointer-events-none mt-0' 
                : 'max-h-[3000px] opacity-100 mt-5'
            }`}>
              {loading ? (
                <div className="py-20 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-700 rounded-full animate-spin"></div>
                  Memuat basis data sebaran kelas...
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="py-16 text-center cozy-paper-card border border-dashed border-cream-300 text-slate-400 font-medium text-xs space-y-3">
                  <i className="ph-duotone ph-squares-four text-3xl text-cream-300 block mx-auto"></i>
                  <p>Belum ada kelas yang terdaftar dalam database.</p>
                  <button 
                    onClick={handleSeedDefaults} 
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Generate 31 Kelas Default
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visual Grid categorized by Level */}
                  {['XII', 'XI', 'X'].map(lvl => {
                    // Only display level if it matches filtering tab
                    if (activeTab !== 'ALL' && activeTab !== lvl) return null;

                    const lvlClasses = filteredClasses.filter(c => c.grade === lvl);
                    if (lvlClasses.length === 0) return null;

                    return (
                      <div key={lvl} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-amber-600 rounded-full"></span>
                            Kelas Tingkat {lvl}
                          </h4>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                            {lvlClasses.filter(c => representedClassNames.includes(c.name.toUpperCase())).length} / {lvlClasses.length} Terwakili
                          </span>
                        </div>

                        {/* Level Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {lvlClasses.map(cls => {
                            const classMembers = members.filter(m => m.class.trim().toUpperCase() === cls.name.toUpperCase());
                            const isRepresented = classMembers.length > 0;

                            return (
                              <div 
                                key={cls.id}
                                className={`group relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between min-h-[5.5rem] py-2.5 px-3 ${
                                  !cls.is_active 
                                    ? 'bg-slate-100/50 border-slate-200 opacity-60'
                                    : isRepresented 
                                      ? 'bg-amber-50/15 border-amber-300 hover:border-amber-400 hover:shadow-[0_4px_12px_rgba(245,158,11,0.06)] hover:-translate-y-0.5' 
                                      : 'bg-white border-cream-200/80 hover:border-cream-300 hover:-translate-y-0.5'
                                }`}
                              >
                                {/* Class label */}
                                <div className="flex justify-between items-center">
                                  <span className={`text-xs font-black font-mono tracking-wide ${isRepresented ? 'text-amber-800' : 'text-slate-700'}`}>
                                    {cls.name}
                                  </span>
                                  
                                  {/* Edit & Delete hover controls (Always visible on mobile, hover-triggered on desktop) */}
                                  <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                                    <button 
                                      onClick={() => handleEdit(cls)}
                                      title="Edit Kelas"
                                      className="p-1 hover:bg-cream-100 rounded text-slate-500 hover:text-amber-700 transition cursor-pointer"
                                    >
                                      <i className="ph-bold ph-pencil-simple text-[10px]"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(cls)}
                                      title="Hapus Kelas"
                                      className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-700 transition cursor-pointer"
                                    >
                                      <i className="ph-bold ph-trash text-[10px]"></i>
                                    </button>
                                  </div>
                                </div>

                                {/* Representation badge */}
                                <div className="flex items-center justify-between mt-2.5 gap-1">
                                  {!cls.is_active ? (
                                    <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                      NONAKTIF
                                    </span>
                                  ) : isRepresented ? (
                                    <span 
                                      title={classMembers.map(m => `${m.name} (${m.position})`).join(', ')}
                                      className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100/40 border border-emerald-300/40 px-1.5 py-0.5 rounded flex items-center gap-1 select-none truncate"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                                      {classMembers.length} Anak
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                      Kosong
                                    </span>
                                  )}

                                  {/* Micro avatar preview tooltips on hover */}
                                  {isRepresented && (
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {classMembers.slice(0, 3).map((m, idx) => (
                                        m.avatar_url ? (
                                          <img
                                            key={m.id}
                                            src={m.avatar_url}
                                            alt={m.name}
                                            title={`${m.name} - ${m.position}`}
                                            className="w-4 h-4 rounded-full border border-white object-cover bg-amber-100 shrink-0"
                                          />
                                        ) : (
                                          <div 
                                            key={m.id}
                                            title={`${m.name} - ${m.position}`}
                                            className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 border border-white text-[8px] font-bold flex items-center justify-center font-mono uppercase shrink-0"
                                          >
                                            {m.name.charAt(0)}
                                          </div>
                                        )
                                      ))}
                                      {classMembers.length > 3 && (
                                        <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 border border-white text-[7px] font-bold flex items-center justify-center font-mono">
                                          +{classMembers.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
