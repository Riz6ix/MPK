import React, { useState, useEffect, useRef } from 'react';
import { supabase, withTimeout, logActivity } from '../lib/supabase';

interface Generation {
  id: string;
  name: string;
  active_year: number;
  graduation_year: number;
}

interface Alumni {
  id: string;
  name: string;
  position: string;
  class: string;
  commission: string;
  avatar_url: string | null;
  gender: string;
  generation_id: string | null;
  generations?: Generation;
}

const STYLES_LIST = ['identicon', 'pixel-art', 'bottts', 'adventurer', 'lorelei', 'miniavs', 'initials'];

export default function ReactAlumniTable() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [className, setClassName] = useState('');
  const [commission, setCommission] = useState('Inti');
  const [gender, setGender] = useState('Laki-laki');
  const [generationId, setGenerationId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Generation Form
  const [showNewGenForm, setShowNewGenForm] = useState(false);
  const [newGenName, setNewGenName] = useState('');
  const [newGenActiveYear, setNewGenActiveYear] = useState(new Date().getFullYear());
  const [newGenGradYear, setNewGenGradYear] = useState(new Date().getFullYear() + 1);
  const [isAddingGen, setIsAddingGen] = useState(false);

  // Positions
  const [positions, setPositions] = useState<{ id: string; title: string; commission: string }[]>([]);

  // Avatar
  const [avatarStyle, setAvatarStyle] = useState('all');
  const [activeStyle, setActiveStyle] = useState('identicon'); // stable initial for SSR hydration
  const [identiconSeed, setIdenticonSeed] = useState('Parchment'); // stable initial for SSR hydration
  const [classes, setClasses] = useState<{ name: string; grade: string }[]>([]);

  // States for Smart Batch Import
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Dropdown open states
  const [isCommOpen, setIsCommOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);

  // Refs for click-outside
  const commRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const genRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (commRef.current && !commRef.current.contains(e.target as Node)) setIsCommOpen(false);
      if (posRef.current && !posRef.current.contains(e.target as Node)) setIsPosOpen(false);
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) setIsStyleOpen(false);
      if (genRef.current && !genRef.current.contains(e.target as Node)) setIsGenOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetchAlumni();
    fetchGenerations();
    fetchPositions();

    // Randomize avatar preview on first client-side mount (safe from SSR hydration mismatch)
    const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
    setActiveStyle(randomStyle);
    setIdenticonSeed(Math.random().toString(36).substring(2, 9));

    async function fetchClasses() {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('name, grade, order_index')
          .eq('is_active', true);
        if (error) throw error;
        if (data && data.length > 0) {
          const gradeOrderMap: Record<string, number> = { 'X': 1, 'XI': 2, 'XII': 3 };
          const sorted = [...data].sort((a, b) => {
            if (gradeOrderMap[a.grade] !== gradeOrderMap[b.grade]) {
              return gradeOrderMap[a.grade] - gradeOrderMap[b.grade];
            }
            return (a.order_index || 0) - (b.order_index || 0);
          });
          setClasses(sorted);
        } else {
          setClasses(generateDefaultClasses());
        }
      } catch (err) {
        console.error('Gagal mengambil kelas:', err);
        setClasses(generateDefaultClasses());
      }
    }
    
    function generateDefaultClasses() {
      const arr = [];
      for (let i = 1; i <= 11; i++) arr.push({ name: `X-E${i}`, grade: 'X' });
      for (let i = 1; i <= 10; i++) arr.push({ name: `XI-F${i}`, grade: 'XI' });
      for (let i = 1; i <= 10; i++) arr.push({ name: `XII-F${i}`, grade: 'XII' });
      return arr;
    }
    
    fetchClasses();
  }, []);

  // Realtime channel dipisah dari initial fetch
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const setupChannel = () => {
      channel = supabase
        .channel('alumni-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alumni' }, () => fetchAlumni(true))
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
  }, []);

  useEffect(() => {
    const filtered = positions.filter(p => p.commission === commission);
    if (filtered.length > 0 && !filtered.some(p => p.title === position)) {
      setPosition(filtered[0].title);
    } else if (filtered.length === 0 && positions.length > 0) {
      setPosition('');
    }
  }, [commission, positions]);

  useEffect(() => {
    if (avatarStyle !== 'all') {
      setActiveStyle(avatarStyle);
    } else {
      setActiveStyle(STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)]);
    }
  }, [avatarStyle]);

  // Auto-set first generation when loaded
  useEffect(() => {
    if (generations.length > 0 && !generationId) {
      setGenerationId(generations[0].id);
    }
  }, [generations]);

  const fetchAlumni = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    } else setIsRefreshing(true);
    try {
      // Ambil kolom alumni dan relasi angkatan secara eksplisit, dengan timeout
      const { data, error } = await withTimeout(
        supabase
          .from('alumni')
          .select('id, name, position, class, commission, gender, avatar_url, order_index, generation_id, created_at, updated_at, generations(id, name, active_year, graduation_year)')
          .order('name', { ascending: true }),
        10000,
        'alumni'
      );
      if (error) throw error;
      if (data) setAlumni(data);
    } catch (err: any) {
      if (!silent) setFetchError(err.message);
      else setErrorMessage('Gagal memperbarui data alumni: ' + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      // Ambil kolom angkatan secara eksplisit
      const { data, error } = await supabase
        .from('generations')
        .select('id, name, active_year, graduation_year, created_at, updated_at')
        .order('graduation_year', { ascending: false });
      if (error) throw error;
      if (data) setGenerations(data);
    } catch (err: any) {
      console.error('Gagal memuat angkatan:', err.message);
    }
  };

  const fetchPositions = async () => {
    try {
      // Ambil kolom jabatan secara eksplisit
      const { data, error } = await supabase
        .from('positions')
        .select('id, title, parent_id, order_index, commission, created_at')
        .order('order_index', { ascending: true });
      if (error) throw error;
      if (data) setPositions(data);
    } catch (err: any) {
      console.error('Gagal memuat jabatan:', err.message);
    }
  };

  const handleAddGeneration = async () => {
    if (!newGenName.trim()) return;
    setIsAddingGen(true);
    try {
      const { error } = await supabase.from('generations').insert([{
        name: newGenName.trim(),
        active_year: newGenActiveYear,
        graduation_year: newGenGradYear,
      }]);
      if (error) throw error;
      setSuccessMessage(`Selesai, angkatan ${newGenName} ditambahkan.`);
      setNewGenName('');
      setShowNewGenForm(false);
      await fetchGenerations();
    } catch (err: any) {
      setErrorMessage('Gagal menambah angkatan: ' + err.message);
    } finally {
      setIsAddingGen(false);
    }
  };

  const handleReset = () => {
    setName(''); setPosition(''); setClassName('');
    setCommission('Inti'); setGender('Laki-laki');
    setGenerationId(generations[0]?.id || '');
    setEditingId(null);
    setAvatarStyle('all');
    setIdenticonSeed(Math.random().toString(36).substring(2, 9));
    setIsCommOpen(false); setIsPosOpen(false);
    setIsStyleOpen(false); setIsGenOpen(false);
  };

  const handleRandomize = () => {
    setIdenticonSeed(Math.random().toString(36).substring(2, 9));
    if (avatarStyle === 'all') setActiveStyle(STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)]);
  };

  // Smart Batch Import Handler for Alumni
  const handleBatchImport = async () => {
    if (!batchInputText.trim()) return;
    setIsImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const lines = batchInputText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedPayloads: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let parts = line.split(/[|;,\t]+/).map(p => p.trim()).filter(Boolean);

        // Fallback split by ' - ' with spaces to avoid splitting classes like XII-F1
        if (parts.length < 3 && !line.includes('|') && !line.includes(',') && !line.includes(';')) {
          parts = line.split(/\s+-\s+/).map(p => p.trim()).filter(Boolean);
        }

        if (parts.length < 2) {
          throw new Error(`Baris ${i + 1} tidak valid: "${line}". Minimal harus diisi Nama dan Jabatan.`);
        }

        const name = parts[0];
        const position = parts[1];
        let className = parts[2] || 'XII-F1';
        let commission = parts[3] || 'Inti';
        let gender = parts[4] || 'Laki-laki';

        // ── HAK EKSKLUSIF DEVELOPER = RIZKY SETIAWAN ──
        const isDeveloperRole = position.toLowerCase().includes('developer');
        if (isDeveloperRole && name.toLowerCase() !== 'rizky setiawan') {
          throw new Error(`Akses Ditolak (Baris ${i + 1}): Jabatan Developer dikunci secara eksklusif untuk Rizky Setiawan (Angkatan Primordial)!`);
        }

        // Intelligent commission guessing
        if (!parts[3]) {
          const lowerPos = position.toLowerCase();
          if (lowerPos.includes('ketua') || lowerPos.includes('sekretaris') || lowerPos.includes('bendahara') || lowerPos.includes('developer')) {
            commission = 'Inti';
          } else if (lowerPos.includes('komisi a')) {
            commission = 'A';
          } else if (lowerPos.includes('komisi b')) {
            commission = 'B';
          } else if (lowerPos.includes('komisi c')) {
            commission = 'C';
          } else if (lowerPos.includes('komisi d')) {
            commission = 'D';
          } else if (lowerPos.includes('komisi e')) {
            commission = 'E';
          } else if (lowerPos.includes('komisi f')) {
            commission = 'F';
          }
        }

        // Intelligent gender guessing
        if (parts[4]) {
          const lowerGen = parts[4].toLowerCase();
          if (lowerGen === 'p' || lowerGen.includes('perempuan') || lowerGen.includes('wanita') || lowerGen.includes('cewe')) {
            gender = 'Perempuan';
          } else {
            gender = 'Laki-laki';
          }
        }

        const stableSeed = encodeURIComponent(name.trim());
        const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
        const finalAvatarUrl = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${stableSeed}`;

        parsedPayloads.push({
          name,
          position,
          class: className,
          commission,
          gender,
          avatar_url: finalAvatarUrl,
          generation_id: generationId || null
        });
      }

      if (parsedPayloads.length === 0) {
        throw new Error('Tidak ada baris data valid yang berhasil diproses.');
      }

      // Bulk Insert into Supabase
      const { error } = await supabase.from('alumni').insert(parsedPayloads);
      if (error) throw error;

      setSuccessMessage(`Sukses mengimpor ${parsedPayloads.length} alumni secara massal!`);
      setBatchInputText('');
      setIsBatchImportOpen(false);
      await fetchAlumni(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor data massal.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // ── HAK EKSKLUSIF DEVELOPER = RIZKY SETIAWAN ──
      const isDeveloperRole = position.toLowerCase().includes('developer');
      const cleanName = name.trim();
      if (isDeveloperRole && cleanName.toLowerCase() !== 'rizky setiawan') {
        throw new Error('Akses Ditolak: Jabatan Developer dikunci secara eksklusif untuk Rizky Setiawan (Angkatan Primordial)!');
      }

      const finalAvatarUrl = `https://api.dicebear.com/9.x/${activeStyle}/svg?seed=${identiconSeed}`;
      const payload: any = {
        name, position, class: className,
        commission, gender,
        avatar_url: finalAvatarUrl,
        generation_id: generationId || null,
      };

      if (editingId) {
        const { error } = await supabase.from('alumni').update(payload).eq('id', editingId);
        if (error) throw error;
        setSuccessMessage('Aman, data alumni diperbarui.');
        logActivity({ action: 'UPDATE_ALUMNI', entity_type: 'alumni', entity_id: editingId, detail: cleanName });
      } else {
        const { data: insertData, error } = await supabase.from('alumni').insert([payload]).select('id').single();
        if (error) throw error;
        setSuccessMessage('Selesai, alumni ditambahkan.');
        logActivity({ action: 'CREATE_ALUMNI', entity_type: 'alumni', entity_id: insertData?.id, detail: cleanName });
      }
      handleReset();
      await fetchAlumni(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    (window as any).showCozyConfirm(
      'Hapus Alumni',
      'Hapus alumni ini? Ga bisa balik lagi ya.',
      async () => {
        try {
          const alumniToDelete = alumni.find(a => a.id === id);
          const cleanName = alumniToDelete ? alumniToDelete.name : 'Unknown';
          const { error } = await supabase.from('alumni').delete().eq('id', id);
          if (error) throw error;
          setSuccessMessage('Aman, alumni dihapus.');
          logActivity({ action: 'DELETE_ALUMNI', entity_type: 'alumni', entity_id: id, detail: cleanName });
          await fetchAlumni(true);
        } catch (err: any) {
          setErrorMessage('Gagal menghapus alumni: ' + err.message);
        }
      }
    );
  };

  const handleReactivate = (member: Alumni) => {
    (window as any).showCozyConfirm(
      'Aktifkan Kembali',
      `Aktifin kembali ${member.name} jadi pengurus aktif?`,
      async () => {
        try {
          // INSERT ke members
          const { error: insertError } = await supabase.from('members').insert([{
            name: member.name,
            position: member.position,
            class: member.class,
            commission: member.commission,
            gender: member.gender,
            avatar_url: member.avatar_url,
            status: 'Aktif',
          }]);
          if (insertError) throw insertError;
          // DELETE dari alumni
          const { error: delError } = await supabase.from('alumni').delete().eq('id', member.id);
          if (delError) throw delError;
          setSuccessMessage(`Selesai, ${member.name} diaktifkan kembali.`);
          logActivity({ action: 'REACTIVATE_ALUMNI', entity_type: 'alumni', entity_id: member.id, detail: `${member.name} diaktifkan kembali` });
          await fetchAlumni(true);
        } catch (err: any) {
          setErrorMessage('Gagal mengaktifkan kembali: ' + err.message);
        }
      }
    );
  };

  const selectedGen = generations.find(g => g.id === generationId);

  const commissionColor = (c: string) => {
    switch(c) {
      case 'Inti': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'A': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'B': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'C': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'D': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'E': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1 animate-fadeIn">
      {/* Form Card */}
      <div className="cozy-paper-card p-6 shadow-md border border-cream-200 self-start">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          {editingId ? (
            <><i className="ph-duotone ph-pencil-line text-cream-600 text-lg"></i> Edit Alumni</>
          ) : (
            <><i className="ph-duotone ph-graduation-cap text-cream-600 text-lg"></i> Tambah Alumni Baru</>
          )}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Nama Lengkap</label>
            <input
              type="text" required
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 leading-normal"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Kelas & Komisi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Kelas Akhir</label>
              <select
                required
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer font-medium leading-normal"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              >
                <option value="">Pilih Kelas...</option>
                {['X', 'XI', 'XII'].map(grade => {
                  const gradeClasses = classes.filter(c => c.grade === grade);
                  if (gradeClasses.length === 0) return null;
                  return (
                    <optgroup key={grade} label={`Tingkat ${grade}`}>
                      {gradeClasses.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div ref={commRef} className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Komisi</label>
              <button type="button" onClick={() => setIsCommOpen(!isCommOpen)}
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal">
                <span>{commission === 'Inti' ? 'Inti' : `Komisi ${commission}`}</span>
                <i className={`ph-bold ${isCommOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm`}></i>
              </button>
              {isCommOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-cream-100/40">
                  {['Inti','A','B','C','D','E','F'].map(c => (
                    <div key={c} onClick={() => { setCommission(c); setIsCommOpen(false); }}
                      className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${commission === c ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''}`}>
                      <span>{c === 'Inti' ? 'Inti' : `Komisi ${c}`}</span>
                      {commission === c && <i className="ph-bold ph-check text-amber-600 text-xs"></i>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jabatan */}
          <div ref={posRef} className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Jabatan Masa Khidmat</label>
            <button type="button" onClick={() => setIsPosOpen(!isPosOpen)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal">
              <span className="truncate">{position || 'Pilih Jabatan...'}</span>
              <i className={`ph-bold ${isPosOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm`}></i>
            </button>
            {isPosOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1 divide-y divide-cream-100/40">
                {positions.filter(p => p.commission === commission).map(p => (
                  <div key={p.id} onClick={() => { setPosition(p.title); setIsPosOpen(false); }}
                    className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${position === p.title ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''}`}>
                    <span>{p.title}</span>
                    {position === p.title && <i className="ph-bold ph-check text-amber-600 text-xs"></i>}
                  </div>
                ))}
                {positions.filter(p => p.commission === commission).length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 font-mono text-center">-- Belum ada jabatan --</div>
                )}
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'Laki-laki', label: 'Laki-Laki', color: 'blue' },
                { val: 'Perempuan', label: 'Perempuan', color: 'pink' },
              ].map(g => (
                <label key={g.val} className={`flex items-center justify-center py-3 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all duration-200 ${
                  gender === g.val
                    ? g.color === 'blue' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm'
                    : 'bg-white border-cream-200 text-slate-600 hover:bg-cream-50'
                }`}>
                  <input type="radio" name="gender" value={g.val} className="sr-only" checked={gender === g.val} onChange={() => setGender(g.val)} />
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${g.color === 'blue' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                    {g.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Angkatan Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Angkatan</label>
              <button type="button" onClick={() => setShowNewGenForm(!showNewGenForm)}
                className="text-[9px] font-bold text-cream-600 hover:text-cream-700 flex items-center gap-0.5 transition">
                <i className="ph-bold ph-plus text-[10px]"></i> Angkatan Baru
              </button>
            </div>

            {/* New Generation Inline Form */}
            {showNewGenForm && (
              <div className="mb-2 p-3 bg-cream-50 border border-cream-300 rounded-xl space-y-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Tambah Angkatan Baru</p>
                <input
                  type="text" placeholder="Nama angkatan (e.g. Angkatan II)"
                  className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-500 transition leading-normal"
                  value={newGenName} onChange={e => setNewGenName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 font-mono block mb-0.5">Masa Khidmat (Tahun)</label>
                    <input type="number" className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-500 transition leading-normal"
                      value={newGenActiveYear} onChange={e => setNewGenActiveYear(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 font-mono block mb-0.5">Lulus (Tahun)</label>
                    <input type="number" className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-500 transition leading-normal"
                      value={newGenGradYear} onChange={e => setNewGenGradYear(Number(e.target.value))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddGeneration} disabled={isAddingGen}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-50">
                    {isAddingGen ? 'Menyimpan...' : 'Simpan Angkatan'}
                  </button>
                  <button type="button" onClick={() => setShowNewGenForm(false)}
                    className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-slate-600 border border-cream-300 rounded-lg text-[10px] font-bold transition cursor-pointer">
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div ref={genRef} className="relative">
              <button type="button" onClick={() => setIsGenOpen(!isGenOpen)}
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal">
                <span className="truncate">{selectedGen ? selectedGen.name : 'Pilih Angkatan...'}</span>
                <i className={`ph-bold ${isGenOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm shrink-0`}></i>
              </button>
              {isGenOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-cream-100/40 max-h-48 overflow-y-auto">
                  {generations.map(g => (
                    <div key={g.id} onClick={() => { setGenerationId(g.id); setIsGenOpen(false); }}
                      className={`px-4 py-2.5 text-xs cursor-pointer transition flex items-center justify-between ${generationId === g.id ? 'bg-amber-50/70 text-amber-900 font-extrabold' : 'text-slate-700 hover:bg-amber-50 hover:text-amber-800'}`}>
                      <div>
                        <div className="font-bold">{g.name}</div>
                        <div className="text-[9px] font-mono text-slate-400">Masa Khidmat {g.active_year} · Lulus {g.graduation_year}</div>
                      </div>
                      {generationId === g.id && <i className="ph-bold ph-check text-amber-600 text-xs"></i>}
                    </div>
                  ))}
                  {generations.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-400 font-mono text-center">-- Belum ada angkatan --</div>
                  )}
                </div>
              )}
            </div>

            {/* Read-only graduation year info */}
            {selectedGen && (
              <div className="mt-1.5 flex gap-2">
                <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                  Masa Khidmat: {selectedGen.active_year}
                </span>
                <span className="text-[9px] font-mono font-bold text-cream-600 bg-cream-50 border border-cream-200 px-2 py-0.5 rounded-full">
                  Lulus: {selectedGen.graduation_year}
                </span>
              </div>
            )}
          </div>

          {/* Avatar Style */}
          <div ref={styleRef} className="relative mb-3">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Gaya Avatar</label>
            <button type="button" onClick={() => setIsStyleOpen(!isStyleOpen)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-xs focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-bold leading-normal">
              <span>
                {avatarStyle === 'all' ? '🎲 All' :
                 avatarStyle === 'identicon' ? 'Identicon (Pola Geometris)' :
                 avatarStyle === 'pixel-art' ? 'Pixel Art (Retro RPG)' :
                 avatarStyle === 'bottts' ? 'Bottts (Robot Manis)' :
                 avatarStyle === 'adventurer' ? 'Adventurer (Petualang)' :
                 avatarStyle === 'lorelei' ? 'Lorelei (Artistik)' :
                 avatarStyle === 'miniavs' ? 'Miniavs (Minimalis)' : 'Initials (Monogram)'}
              </span>
              <i className={`ph-bold ${isStyleOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-xs`}></i>
            </button>
            {isStyleOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1 divide-y divide-cream-100/40">
                {[
                  { val: 'all', label: '🎲 All' },
                  { val: 'identicon', label: 'Identicon (Pola Geometris Retro)' },
                  { val: 'pixel-art', label: 'Pixel Art (RPG / Minecraft Style)' },
                  { val: 'bottts', label: 'Bottts (Karakter Robot Manis)' },
                  { val: 'adventurer', label: 'Adventurer (Karakter Petualang Cozy)' },
                  { val: 'lorelei', label: 'Lorelei (Lencana Lukisan Artistik)' },
                  { val: 'miniavs', label: 'Miniavs (Potret Minimalis Bersahabat)' },
                  { val: 'initials', label: 'Initials (Inisial Monogram Bersih)' },
                ].map(opt => (
                  <div key={opt.val} onClick={() => { setAvatarStyle(opt.val); setIsStyleOpen(false); }}
                    className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${avatarStyle === opt.val ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''}`}>
                    <span>{opt.label}</span>
                    {avatarStyle === opt.val && <i className="ph-bold ph-check text-amber-600 text-xs"></i>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center p-3 bg-cream-50/50 border border-cream-200 rounded-xl">
            <div className="relative group w-20 h-20 rounded-full border-4 border-amber-800 bg-white shadow-md overflow-hidden flex items-center justify-center mb-2.5">
              <img src={`https://api.dicebear.com/9.x/${activeStyle}/svg?seed=${identiconSeed}`} alt="Preview Avatar" className="w-full h-full object-cover p-1 bg-white" />
            </div>
            <button type="button" onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer">
              <i className="ph-duotone ph-dice-five text-amber-400 text-xs sm:text-sm"></i> Random
            </button>
            <div className="mt-3.5 w-full">
              <p className="text-[9px] font-bold text-slate-500 mb-1.5 uppercase font-mono tracking-wider text-center">Pilih Tema Seed</p>
              <div className="grid grid-cols-4 gap-1">
                {['Parchment','Maple','Oak','Amber','Gold','Fern','Sage','Chestnut','Clay','Teal','Bronze','Copper'].map(seed => (
                  <button key={seed} type="button" onClick={() => {
                    setIdenticonSeed(seed);
                    if (avatarStyle === 'all') setActiveStyle(STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)]);
                  }}
                    className={`py-1 px-0.5 text-[8px] font-bold rounded-md border font-mono transition-all duration-150 ${
                      identiconSeed === seed ? 'bg-amber-100 border-amber-400 text-amber-800 font-extrabold shadow-sm' : 'bg-white border-cream-200 text-slate-600 hover:bg-cream-100'
                    }`}>{seed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 space-y-2">
            {editingId && (
              <button type="button" onClick={handleReset}
                className="w-full bg-cream-100 hover:bg-cream-200 text-slate-700 border border-cream-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer">
                Batal Edit
              </button>
            )}
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md btn-shimmer uppercase tracking-wider font-mono">
              {isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Alumni'}
            </button>
          </div>
        </form>
      </div>

      {/* List / Table Card */}
      <div className="lg:col-span-2 cozy-paper-card p-6 shadow-md border border-cream-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <i className="ph-duotone ph-graduation-cap text-cream-600 text-xl"></i>
            Direktori Alumni Purna Bakti
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchImportOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition text-xs font-bold cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <i className="ph-bold ph-file-arrow-up"></i>
              Tempel List
            </button>
            <button onClick={() => fetchAlumni(true)} disabled={isRefreshing}
              className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-cream-700 border border-cream-300 rounded-xl transition text-xs font-bold cursor-pointer shadow-sm active:scale-95 disabled:opacity-60">
              {isRefreshing ? 'Memperbarui...' : 'Refresh'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">{successMessage}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <svg className="animate-spin h-8 w-8 text-cream-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500 text-xs font-medium">Memuat data alumni...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <i className="ph-duotone ph-wifi-slash text-4xl text-red-300"></i>
            <div className="text-center">
              <p className="text-slate-700 text-sm font-bold">Gagal memuat data alumni</p>
              <p className="text-slate-400 text-xs font-mono mt-1 max-w-xs">{fetchError}</p>
            </div>
            <button onClick={() => fetchAlumni()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-2">
              <i className="ph-bold ph-arrow-clockwise"></i> Coba Lagi
            </button>
          </div>
        ) : alumni.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm">Belum ada data alumni purna bakti.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-cream-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-2">Foto</th>
                    <th className="py-3 px-2">Nama & Angkatan</th>
                    <th className="py-3 px-2">Jabatan & Kelas</th>
                    <th className="py-3 px-2">Komisi</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {alumni.map(member => (
                    <tr key={member.id} className="hover:bg-cream-100/40 transition duration-150">
                      <td className="py-3 px-2">
                        <div className="relative inline-block">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2 border-cream-400 shadow-sm bg-white" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cream-100 text-[9px] text-cream-600 border border-cream-300 flex items-center justify-center font-mono uppercase font-bold tracking-wider">KOSONG</div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${member.gender === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'}`}></span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{member.name}</span>
                          <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[8px] font-mono tracking-wider uppercase">Purna Bakti</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{member.gender || 'Laki-laki'}</span>
                          {member.generations && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="font-bold text-slate-500">{member.generations.name}</span>
                              <span className="opacity-40">·</span>
                              <span className="text-cream-600 font-bold">Lulus {member.generations.graduation_year}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm text-slate-600 font-normal">{member.position}</div>
                        <div className="text-xs text-slate-500 font-mono font-bold tracking-wider">{member.class}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border ${commissionColor(member.commission)}`}>
                          {member.commission === 'Inti' ? 'Inti' : `Komisi ${member.commission}`}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right space-x-3">
                        <button onClick={() => handleReactivate(member)}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                          title="Aktifkan Kembali Sebagai Pengurus Aktif">
                          <i className="ph-duotone ph-briefcase text-sm"></i> Aktifkan
                        </button>
                        <button onClick={() => {
                          setEditingId(member.id);
                          setName(member.name);
                          setPosition(member.position);
                          setClassName(member.class);
                          setCommission(member.commission);
                          setGender(member.gender || 'Laki-laki');
                          setGenerationId(member.generation_id || generations[0]?.id || '');
                          const match = member.avatar_url?.match(/9\.x\/([^/]+)\/svg\?seed=([^&]+)/);
                          if (match) { setAvatarStyle(match[1]); setIdenticonSeed(decodeURIComponent(match[2])); }
                          else { setAvatarStyle('identicon'); setIdenticonSeed('Parchment'); }
                          setErrorMessage(null); setSuccessMessage(null);
                        }}
                          className="text-xs font-semibold text-cream-600 hover:text-cream-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(member.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {alumni.map(member => (
                <div key={member.id} className="p-4 bg-cream-50/40 border border-cream-200/60 rounded-2xl shadow-inner space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-cream-400 shadow-sm bg-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-cream-100 text-[8px] text-cream-600 border border-cream-300 flex items-center justify-center font-mono uppercase font-bold">KOSONG</div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-white shadow-sm ${member.gender === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'}`}></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span>{member.name}</span>
                        <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[8px] font-mono uppercase">Purna Bakti</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {member.class} · {member.gender || 'Laki-laki'}
                        {member.generations && <span className="font-bold"> · {member.generations.name}</span>}
                        {member.generations?.graduation_year && <span className="text-cream-600 font-bold"> · Lulus {member.generations.graduation_year}</span>}
                      </div>
                      <div className="text-xs text-slate-600 font-normal mt-1">{member.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-cream-200/50">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider border ${commissionColor(member.commission)}`}>
                      {member.commission === 'Inti' ? 'Inti' : `Komisi ${member.commission}`}
                    </span>
                    <div className="flex gap-3">
                      <button onClick={() => handleReactivate(member)}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer">
                        Aktifkan
                      </button>
                      <button onClick={() => {
                        setEditingId(member.id);
                        setName(member.name);
                        setPosition(member.position);
                        setClassName(member.class);
                        setCommission(member.commission);
                        setGender(member.gender || 'Laki-laki');
                        setGenerationId(member.generation_id || generations[0]?.id || '');
                        const match = member.avatar_url?.match(/9\.x\/([^/]+)\/svg\?seed=([^&]+)/);
                        if (match) { setAvatarStyle(match[1]); setIdenticonSeed(decodeURIComponent(match[2])); }
                        else { setAvatarStyle('identicon'); setIdenticonSeed('Parchment'); }
                      }}
                        className="text-xs font-semibold text-cream-600 hover:text-cream-700 cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(member.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart Batch Import Modal Overlay */}
      {isBatchImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cozy-paper-card max-w-lg w-full p-6 shadow-2xl border-2 border-amber-800/20 relative animate-fadeIn">
            <button
              onClick={() => setIsBatchImportOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer hover:scale-105 transition duration-150"
            >
              <i className="ph-bold ph-x text-lg"></i>
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <i className="ph-duotone ph-file-arrow-up text-amber-600 text-xl"></i>
              Smart Batch Import Alumni
            </h3>
            
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              Salin-tempel baris data alumni Anda di bawah ini secara massal. Format per baris:<br />
              <strong className="font-mono text-amber-800">Nama | Jabatan | Kelas | Komisi (Opsional) | Gender (Opsional)</strong><br />
              *Catatan: Data akan dimasukkan di bawah angkatan <strong className="text-amber-700">{generations.find(g => g.id === generationId)?.name || 'angkatan terpilih'}</strong>.
            </p>

            <div className="space-y-4">
              <textarea
                rows={8}
                value={batchInputText}
                onChange={(e) => setBatchInputText(e.target.value)}
                placeholder="Rizky Setiawan | Developer | XII-F5 | Inti | Laki-laki&#10;Tri Dewi Utami | Ketua MPK | XII-F1 | Inti | Perempuan&#10;Muhamad Saripudin | Wakil Ketua | XII-F5 | Inti | Laki-laki"
                className="w-full bg-cream-50/50 border border-cream-300 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setIsBatchImportOpen(false)}
                  className="flex-1 bg-cream-100 hover:bg-cream-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer border border-cream-300 text-center"
                >
                  Batal
                </button>
                <button
                  onClick={handleBatchImport}
                  disabled={isImporting || !batchInputText.trim()}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center shadow-md active:scale-95 btn-shimmer"
                >
                  {isImporting ? 'Mengimpor...' : 'Mulai Impor Massal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
