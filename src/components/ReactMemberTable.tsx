import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, withTimeout, logActivity } from '../lib/supabase';

interface Member {
  id: string;
  name: string;
  position: string;
  class: string;
  commission: string;
  avatar_url: string | null;
  gender: string;
  status?: string;
  generation?: string;
}

const STYLES_LIST = ['identicon', 'pixel-art', 'bottts', 'adventurer', 'lorelei', 'miniavs', 'initials'];

export default function ReactMemberTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // Untuk retry button di mobile
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // UX Enhancement States
  const [searchQuery, setSearchQuery] = useState('');
  const [formHighlight, setFormHighlight] = useState(false);
  const formCardRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [className, setClassName] = useState('');
  const [commission, setCommission] = useState('Inti');
  const [gender, setGender] = useState('Laki-laki');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Custom States for Purna Bakti / Generation tracking
  const [memberStatus, setMemberStatus] = useState('Aktif');
  const [generation, setGeneration] = useState('Angkatan I');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  // Custom States for Phase 3.3 & "All Styles" randomizer
  const [avatarStyle, setAvatarStyle] = useState('all'); // 'identicon', 'pixel-art', ..., or 'all'
  const [activeStyle, setActiveStyle] = useState('identicon'); // stable initial for SSR hydration
  const [identiconSeed, setIdenticonSeed] = useState('Parchment'); // stable initial for SSR hydration
  const [positions, setPositions] = useState<{ id: string; title: string; commission: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classes, setClasses] = useState<{ name: string; grade: string }[]>([]);

  useEffect(() => {
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

  // States for Smart Re-Generasi
  const [isRegenOpen, setIsRegenOpen] = useState(false);
  const [regenStep, setRegenStep] = useState<'options' | 'class12' | 'all-demision'>('options');
  const [regenGenInput, setRegenGenInput] = useState('Angkatan I');

  // States for Smart Batch Import
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Custom Dropdown Open States
  const [isCommOpen, setIsCommOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);

  // Container refs for click-outside detection
  const commContainerRef = useRef<HTMLDivElement>(null);
  const posContainerRef = useRef<HTMLDivElement>(null);
  const styleContainerRef = useRef<HTMLDivElement>(null);
  const statusContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commContainerRef.current && !commContainerRef.current.contains(event.target as Node)) {
        setIsCommOpen(false);
      }
      if (posContainerRef.current && !posContainerRef.current.contains(event.target as Node)) {
        setIsPosOpen(false);
      }
      if (styleContainerRef.current && !styleContainerRef.current.contains(event.target as Node)) {
        setIsStyleOpen(false);
      }
      if (statusContainerRef.current && !statusContainerRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };

    // Esc to cancel edit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingId) {
        handleReset();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingId]);

  useEffect(() => {
    fetchMembers();
    fetchPositions();

    // Randomize avatar preview on first client-side mount (safe from SSR mismatch)
    const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
    setActiveStyle(randomStyle);
    setIdenticonSeed(Math.random().toString(36).substring(2, 9));
  }, []);

  // Realtime channel dipisah dari initial fetch agar mobile tidak terganggu
  // jika WebSocket carrier-throttled saat pertama load
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const setupChannel = () => {
      channel = supabase
        .channel('members-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'members' },
          () => {
            fetchMembers(true);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Auto-reconnect setelah 5 detik jika channel error
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

  // Sync position dropdown selection when commission or positions load/change
  useEffect(() => {
    const filtered = positions.filter(p => p.commission === commission);
    if (filtered.length > 0) {
      if (!filtered.some(p => p.title === position)) {
        setPosition(filtered[0].title);
      }
    } else {
      if (positions.length > 0) {
        setPosition('');
      }
    }
  }, [commission, positions]);

  // Sync activeStyle concrete style when avatarStyle changes
  useEffect(() => {
    if (avatarStyle !== 'all') {
      setActiveStyle(avatarStyle);
    } else {
      // Pick a random style on selecting 'all' for instant feedback
      const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
      setActiveStyle(randomStyle);
    }
  }, [avatarStyle]);

  const fetchMembers = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    } else {
      setIsRefreshing(true);
    }
    try {
      // Ambil kolom pengurus secara eksplisit, dengan timeout 10 detik untuk mobile
      const { data, error } = await withTimeout(
        supabase
          .from('members')
          .select('id, name, position, class, commission, avatar_url, order_index, created_at, updated_at, gender, status, generation')
          .order('name', { ascending: true }),
        10000,
        'members'
      );

      if (error) throw error;
      if (data) setMembers(data);
    } catch (err: any) {
      if (!silent) setFetchError(err.message);
      else setErrorMessage('Gagal memperbarui data: ' + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchPositions = async () => {
    try {
      // Ambil kolom struktur jabatan secara eksplisit, dengan timeout 10 detik
      const { data, error } = await withTimeout(
        supabase
          .from('positions')
          .select('id, title, parent_id, order_index, commission, created_at')
          .order('order_index', { ascending: true }),
        10000,
        'positions'
      );

      if (error) throw error;
      if (data) setPositions(data);
    } catch (err: any) {
      console.error('Gagal memuat daftar jabatan:', err.message);
    }
  };

  const handleReset = () => {
    setName('');
    setPosition('');
    setClassName('');
    setCommission('Inti');
    setGender('Laki-laki');
    setEditingId(null);
    setMemberStatus('Aktif');
    setGeneration('Angkatan I');
    setAvatarStyle('all');
    setIdenticonSeed(Math.random().toString(36).substring(2, 9));
    setIsCommOpen(false);
    setIsPosOpen(false);
    setIsStyleOpen(false);
    setIsStatusOpen(false);
  };

  const handleRandomize = () => {
    const newSeed = Math.random().toString(36).substring(2, 9);
    setIdenticonSeed(newSeed);
    
    if (avatarStyle === 'all') {
      const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
      setActiveStyle(randomStyle);
    }
  };

  const handleSelectSeed = (seed: string) => {
    setIdenticonSeed(seed);
    
    if (avatarStyle === 'all') {
      const randomStyle = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)];
      setActiveStyle(randomStyle);
    }
  };

  const handleRegenClass12 = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    setIsRegenOpen(false);
    try {
      const targetCount = members.filter(
        m => m.class.toUpperCase().startsWith('XII') && m.status !== 'Demisioner'
      ).length;

      if (targetCount === 0) {
        throw new Error('Tidak ditemukan pengurus kelas XII aktif untuk didemisionkan.');
      }

      const { error } = await supabase
        .from('members')
        .update({ status: 'Demisioner' })
        .ilike('class', 'XII%')
        .eq('status', 'Aktif');

      if (error) throw error;
      setSuccessMessage(`Sukses mendemisionkan ${targetCount} pengurus kelas XII menjadi Purna Bakti!`);
      await fetchMembers(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendemisionkan kelas XII');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenAllActive = async () => {
    if (!regenGenInput.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    setIsRegenOpen(false);
    try {
      const activeCount = members.filter(m => m.status !== 'Demisioner').length;
      if (activeCount === 0) {
        throw new Error('Tidak ada pengurus aktif yang tersisa untuk didemisionkan.');
      }

      const { error } = await supabase
        .from('members')
        .update({ status: 'Demisioner', generation: regenGenInput.trim() })
        .eq('status', 'Aktif');

      if (error) throw error;
      setSuccessMessage(`Sukses mendemisionkan seluruh ${activeCount} pengurus aktif ke "${regenGenInput.trim()}"!`);
      await fetchMembers(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal melakukan peremajaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smart Batch Import Handler
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
          status: 'Aktif',
          generation: 'Angkatan I'
        });
      }

      if (parsedPayloads.length === 0) {
        throw new Error('Tidak ada baris data valid yang berhasil diproses.');
      }

      // Bulk Insert into Supabase
      const { error } = await supabase.from('members').insert(parsedPayloads);
      if (error) throw error;

      setSuccessMessage(`Sukses mengimpor ${parsedPayloads.length} pengurus baru secara massal!`);
      setBatchInputText('');
      setIsBatchImportOpen(false);
      await fetchMembers(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor data massal.');
    } finally {
      setIsImporting(false);
    }
  };

  // Scroll-to-form + highlight + focus helper
  const scrollToForm = useCallback(() => {
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus();
      setFormHighlight(true);
      setTimeout(() => setFormHighlight(false), 1200);
    }, 50);
  }, []);

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

      // Validate singular unique positions (Inti commission or positions containing 'Koordinator')
      const isSinglePosition = commission === 'Inti' || position.toLowerCase().includes('koordinator');

      if (isSinglePosition) {
        const occupiedMember = members.find(
          m => m.commission === commission && m.position === position && m.id !== editingId
        );
        if (occupiedMember) {
          throw new Error(`Jabatan "${position}" sudah ditempati oleh ${occupiedMember.name}. Jabatan Inti dan Koordinator bersifat tunggal (maksimal 1 orang).`);
        }
      }

      const finalAvatarUrl = `https://api.dicebear.com/9.x/${activeStyle}/svg?seed=${identiconSeed}`;

      const payload: any = {
        name,
        position,
        class: className,
        commission,
        gender,
        avatar_url: finalAvatarUrl,
        status: memberStatus,
        generation,
      };

      if (editingId) {
        const { error } = await supabase
          .from('members')
          .update(payload)
          .eq('id', editingId);
        
        if (error) throw error;
        setSuccessMessage('Aman, data anggota diperbarui.');
        logActivity({ action: 'UPDATE_MEMBER', entity_type: 'member', entity_id: editingId, detail: cleanName });
      } else {
        const { data: insertData, error } = await supabase
          .from('members')
          .insert([payload])
          .select('id')
          .single();
        
        if (error) throw error;
        setSuccessMessage(`Selesai, ${cleanName} ditambahkan.`);
        logActivity({ action: 'CREATE_MEMBER', entity_type: 'member', entity_id: insertData?.id, detail: cleanName });
      }

      handleReset();
      await fetchMembers(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, memberName: string) => {
    (window as any).showCozyConfirm(
      'Hapus Anggota',
      `Hapus ${memberName}? Ga bisa balik lagi ya.`,
      async () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
          const { error } = await supabase.from('members').delete().eq('id', id);
          if (error) throw error;
          setSuccessMessage(`Selesai, ${memberName} dihapus.`);
          logActivity({ action: 'DELETE_MEMBER', entity_type: 'member', entity_id: id, detail: memberName });
          await fetchMembers(true);
        } catch (err: any) {
          setErrorMessage('Gagal menghapus anggota: ' + err.message);
        }
      }
    );
  };

  const activeMembers = members.filter(m => m.status === 'Aktif' || !m.status);

  // Filtered list based on search query
  const filteredMembers = searchQuery.trim()
    ? activeMembers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.commission.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.class.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeMembers;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1">

      {/* Form Card */}
      <div
        ref={formCardRef}
        className={`cozy-paper-card p-6 shadow-md border self-start transition-all duration-500 ${
          formHighlight
            ? 'border-amber-400 ring-2 ring-amber-300/50 shadow-amber-100'
            : 'border-cream-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            {editingId ? (
              <>
                <i className="ph-duotone ph-pencil-line text-amber-600 text-lg"></i>
                <span className="text-amber-700">Edit Anggota</span>
              </>
            ) : (
              <>
                <i className="ph-duotone ph-user-plus text-cream-600 text-lg"></i> Tambah Anggota Baru
              </>
            )}
          </h3>
          {editingId && (
            <span className="text-[9px] font-mono text-slate-400 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-200">
              ESC untuk batal
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Nama Lengkap</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="Nama lengkap pengurus"
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 leading-normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Kelas</label>
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
            <div ref={commContainerRef} className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Komisi</label>
              <button
                type="button"
                onClick={() => setIsCommOpen(!isCommOpen)}
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal"
              >
                <span>{commission === 'Inti' ? 'Inti' : `Komisi ${commission}`}</span>
                <i className={`ph-bold ${isCommOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm`}></i>
              </button>

              {isCommOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-cream-100/40">
                  {['Inti', 'A', 'B', 'C', 'D', 'E', 'F'].map((comm) => (
                    <div
                      key={comm}
                      onClick={() => {
                        setCommission(comm);
                        setIsCommOpen(false);
                      }}
                      className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${
                        commission === comm ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''
                      }`}
                    >
                      <span>{comm === 'Inti' ? 'Inti' : `Komisi ${comm}`}</span>
                      {commission === comm && (
                        <i className="ph-bold ph-check text-amber-600 text-xs"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={posContainerRef} className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Jabatan</label>
            <button
              type="button"
              onClick={() => setIsPosOpen(!isPosOpen)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal"
            >
              <span className="truncate">{position || 'Pilih Jabatan...'}</span>
              <i className={`ph-bold ${isPosOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm`}></i>
            </button>

            {isPosOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1 divide-y divide-cream-100/40">
                {positions.filter(p => p.commission === commission).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setPosition(p.title);
                      setIsPosOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${
                      position === p.title ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''
                    }`}
                  >
                    <span>{p.title}</span>
                    {position === p.title && (
                      <i className="ph-bold ph-check text-amber-600 text-xs"></i>
                    )}
                  </div>
                ))}
                {positions.filter(p => p.commission === commission).length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 font-mono text-center">
                    -- Belum ada jabatan di komisi ini --
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">
              Jabatan dikelola di halaman <a href="/admin/positions" className="text-amber-700 font-bold hover:underline">Hirarki Jabatan</a>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center py-3 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all duration-200 ${
                gender === 'Laki-laki' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                  : 'bg-white border-cream-200 text-slate-600 hover:bg-cream-50'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="Laki-laki"
                  className="sr-only"
                  checked={gender === 'Laki-laki'}
                  onChange={() => setGender('Laki-laki')}
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Laki-Laki
                </span>
              </label>
              
              <label className={`flex items-center justify-center py-3 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all duration-200 ${
                gender === 'Perempuan' 
                  ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm' 
                  : 'bg-white border-cream-200 text-slate-600 hover:bg-cream-50'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="Perempuan"
                  className="sr-only"
                  checked={gender === 'Perempuan'}
                  onChange={() => setGender('Perempuan')}
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400"></span> Perempuan
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Angkatan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Angkatan I"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 leading-normal"
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
              />
            </div>
            <div ref={statusContainerRef} className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Status</label>
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium leading-normal"
              >
                <span>{memberStatus === 'Demisioner' ? 'Purna Bakti' : 'Aktif'}</span>
                <i className={`ph-bold ${isStatusOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm`}></i>
              </button>

              {isStatusOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-cream-100/40">
                  {['Aktif', 'Demisioner'].map((st) => (
                    <div
                      key={st}
                      onClick={() => {
                        setMemberStatus(st);
                        setIsStatusOpen(false);
                      }}
                      className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${
                        memberStatus === st ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''
                      }`}
                    >
                      <span>{st === 'Demisioner' ? 'Purna Bakti' : 'Aktif'}</span>
                      {memberStatus === st && (
                        <i className="ph-bold ph-check text-amber-600 text-xs"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={styleContainerRef} className="relative mb-3">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Gaya Avatar</label>
            <button
              type="button"
              onClick={() => setIsStyleOpen(!isStyleOpen)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-xs focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-bold leading-normal"
            >
              <span>
                {avatarStyle === 'all' ? '🎲 All' : 
                 avatarStyle === 'identicon' ? 'Identicon (Pola Geometris)' :
                 avatarStyle === 'pixel-art' ? 'Pixel Art (Retro RPG)' :
                 avatarStyle === 'bottts' ? 'Bottts (Robot Manis)' :
                 avatarStyle === 'adventurer' ? 'Adventurer (Petualang)' :
                 avatarStyle === 'lorelei' ? 'Lorelei (Artistik)' :
                 avatarStyle === 'miniavs' ? 'Miniavs (Minimalis)' :
                 'Initials (Monogram)'
                }
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
                ].map((opt) => (
                  <div
                    key={opt.val}
                    onClick={() => {
                      setAvatarStyle(opt.val);
                      setIsStyleOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${
                      avatarStyle === opt.val ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''
                    }`}
                  >
                    <span>{opt.label}</span>
                    {avatarStyle === opt.val && (
                      <i className="ph-bold ph-check text-amber-600 text-xs"></i>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-cream-50/50 border border-cream-200 rounded-xl">
            {/* Gamerpic xbox style round avatar with elegant dark-oak frame */}
            <div className="relative group w-20 h-20 rounded-full border-4 border-amber-800 bg-white shadow-md overflow-hidden flex items-center justify-center mb-2.5">
              <img 
                src={`https://api.dicebear.com/9.x/${activeStyle}/svg?seed=${identiconSeed}`} 
                alt="Preview Avatar"
                className="w-full h-full object-cover p-1 bg-white"
              />
            </div>
            
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
            >
              <i className="ph-duotone ph-dice-five text-amber-400 text-xs sm:text-sm"></i> Random
            </button>
            
            <div className="mt-3.5 w-full">
              <p className="text-[9px] font-bold text-slate-500 mb-1.5 uppercase font-mono tracking-wider text-center">Pilih Tema Seed</p>
              <div className="grid grid-cols-4 gap-1">
                {['Parchment', 'Maple', 'Oak', 'Amber', 'Gold', 'Fern', 'Sage', 'Chestnut', 'Clay', 'Teal', 'Bronze', 'Copper'].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleSelectSeed(seed)}
                    className={`py-1 px-0.5 text-[8px] font-bold rounded-md border font-mono transition-all duration-150 ${
                      identiconSeed === seed
                        ? 'bg-amber-100 border-amber-400 text-amber-800 font-extrabold shadow-sm'
                        : 'bg-white border-cream-200 text-slate-600 hover:bg-cream-100'
                    }`}
                  >
                    {seed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            {editingId && (
              <button
                type="button"
                className="w-full bg-cream-100 hover:bg-cream-200 text-slate-700 border border-cream-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                onClick={handleReset}
              >
                Batal Edit
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md btn-shimmer uppercase tracking-wider font-mono"
            >
              {isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </button>
          </div>
        </form>
      </div>

      {/* List / Table Card */}
      <div className="lg:col-span-2 cozy-paper-card p-6 shadow-md border border-cream-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <i className="ph-duotone ph-users-three text-cream-600 text-xl"></i>
            Pengurus MPK Terdaftar
            <span className="ml-1 px-2 py-0.5 bg-cream-100 border border-cream-300 text-cream-600 rounded-full text-[10px] font-mono font-bold">
              {activeMembers.length}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchImportOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition text-xs font-bold cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <i className="ph-bold ph-file-arrow-up"></i>
              Tempel List
            </button>
            <button
              onClick={() => {
                setRegenStep('options');
                setRegenGenInput('Angkatan I');
                setIsRegenOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition text-xs font-black cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <i className="ph-bold ph-gear-six"></i>
              Re-Generasi
            </button>
            <button 
              onClick={() => fetchMembers(true)}
              className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-cream-700 border border-cream-300 rounded-xl transition text-xs font-bold cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Memperbarui...' : 'Refresh'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-start gap-2">
            <i className="ph-duotone ph-warning text-red-500 text-sm shrink-0 mt-0.5"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-2">
            <i className="ph-duotone ph-check-circle text-emerald-500 text-sm shrink-0 mt-0.5"></i>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-5">
          <i className="ph-duotone ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
          <input
            type="text"
            placeholder="Cari nama, jabatan, komisi, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cream-50/60 border border-cream-200 rounded-xl pl-10 pr-10 py-3 text-slate-700 text-xs placeholder-slate-400 focus:outline-none focus:border-cream-400 focus:ring-1 focus:ring-cream-400/30 transition duration-200 leading-normal"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition"
            >
              <i className="ph-bold ph-x text-xs"></i>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <svg className="animate-spin h-8 w-8 text-cream-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500 text-xs font-medium">Memuat data pengurus...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <i className="ph-duotone ph-wifi-slash text-4xl text-red-300"></i>
            <div className="text-center space-y-1">
              <p className="text-slate-700 text-sm font-bold">Gagal memuat data</p>
              <p className="text-slate-500 text-xs font-mono max-w-xs">{fetchError}</p>
            </div>
            <button
              onClick={() => fetchMembers()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-2"
            >
              <i className="ph-bold ph-arrow-clockwise"></i>
              Coba Lagi
            </button>
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="text-center py-12">
            <i className="ph-duotone ph-users text-4xl text-cream-300 mb-3 block"></i>
            <p className="text-slate-500 text-sm font-medium">Belum ada pengurus aktif terdaftar.</p>
            <button
              onClick={scrollToForm}
              className="mt-3 text-xs text-amber-700 font-bold hover:underline cursor-pointer"
            >
              + Tambah anggota pertama
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-10">
            <i className="ph-duotone ph-magnifying-glass text-3xl text-cream-300 mb-2 block"></i>
            <p className="text-slate-500 text-xs font-medium">Tidak ada hasil untuk <strong className="text-slate-700">"{searchQuery}"</strong>.</p>
            <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-amber-700 font-bold hover:underline cursor-pointer">Hapus filter</button>
          </div>
        ) : (
          <div className="space-y-4">
            {searchQuery && (
              <p className="text-[10px] font-mono text-slate-400">
                Menampilkan <strong className="text-slate-600">{filteredMembers.length}</strong> dari {activeMembers.length} pengurus aktif
              </p>
            )}
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-cream-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-2">Foto</th>
                    <th className="py-3 px-2">Nama</th>
                    <th className="py-3 px-2">Jabatan & Kelas</th>
                    <th className="py-3 px-2">Komisi</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-cream-100/40 transition duration-150 ${
                        editingId === member.id ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-200' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="relative inline-block">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.name} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-cream-400 shadow-sm bg-white" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cream-100 text-[9px] text-cream-600 border border-cream-300 flex items-center justify-center font-mono uppercase font-bold tracking-wider">
                              KOSONG
                            </div>
                          )}
                          {/* Pink / Blue Gender Dot badge */}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                            member.gender === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'
                          }`} title={member.gender || 'Laki-laki'}></span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.status === 'Demisioner' && (
                            <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[8px] font-mono tracking-wider uppercase">Purna Bakti</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {member.gender || 'Laki-laki'} · <span className="font-bold">{member.generation || 'Angkatan I'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm text-slate-600 font-normal">{member.position}</div>
                        <div className="text-xs text-slate-500 font-mono font-bold tracking-wider">{member.class}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                          member.commission === 'Inti' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          member.commission === 'A' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          member.commission === 'B' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                          member.commission === 'C' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          member.commission === 'D' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          member.commission === 'E' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {member.commission === 'Inti' ? 'Inti' : `Komisi ${member.commission}`}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right space-x-3">
                        <button
                          onClick={async () => {
                            const newStatus = member.status === 'Demisioner' ? 'Aktif' : 'Demisioner';
                            try {
                              const { error } = await supabase
                                .from('members')
                                .update({ status: newStatus })
                                .eq('id', member.id);
                              if (error) throw error;
                              setSuccessMessage(`Status ${member.name} berhasil diubah menjadi ${newStatus === 'Demisioner' ? 'Purna Bakti' : 'Aktif'}!`);
                              await fetchMembers(true);
                            } catch (err: any) {
                              setErrorMessage('Gagal mengubah status: ' + err.message);
                            }
                          }}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex inline-items items-center gap-0.5 inline-flex"
                          title={member.status === 'Demisioner' ? 'Aktifkan Kembali' : 'Demisionkan (Purna Bakti)'}
                        >
                          <i className={`ph-duotone ${member.status === 'Demisioner' ? 'ph-briefcase' : 'ph-graduation-cap'} text-sm`}></i>
                          {member.status === 'Demisioner' ? 'Aktifkan' : 'Purna'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(member.id);
                            setName(member.name);
                            setPosition(member.position);
                            setClassName(member.class);
                            setCommission(member.commission);
                            setGender(member.gender || 'Laki-laki');
                            setMemberStatus(member.status || 'Aktif');
                            setGeneration(member.generation || 'Angkatan I');
                            
                            const match = member.avatar_url?.match(/9\.x\/([^/]+)\/svg\?seed=([^&]+)/);
                            if (match) {
                              setAvatarStyle(match[1]);
                              setIdenticonSeed(decodeURIComponent(match[2]));
                            } else {
                              setAvatarStyle('identicon');
                              setIdenticonSeed('Parchment');
                            }
                            
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            setIsCommOpen(false);
                            setIsPosOpen(false);
                            setIsStyleOpen(false);
                            setIsStatusOpen(false);
                            scrollToForm();
                          }}
                          className={`text-xs font-semibold cursor-pointer hover:underline ${
                            editingId === member.id
                              ? 'text-amber-600 font-bold'
                              : 'text-cream-600 hover:text-cream-700'
                          }`}
                        >
                          {editingId === member.id ? '✎ Editing...' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="block sm:hidden space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 bg-cream-50/40 border border-cream-200/60 rounded-2xl shadow-inner space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-cream-400 shadow-sm bg-white" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-cream-100 text-[8px] text-cream-600 border border-cream-300 flex items-center justify-center font-mono uppercase font-bold tracking-wider">
                          KOSONG
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-white shadow-sm ${
                        member.gender === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'
                      }`}></span>
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 text-sm truncate flex items-center gap-1.5 flex-wrap">
                        <span>{member.name}</span>
                        {member.status === 'Demisioner' && (
                          <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[8px] font-mono tracking-wider uppercase">Purna Bakti</span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {member.class} • {member.gender || 'Laki-laki'} • <span className="font-bold">{member.generation || 'Angkatan I'}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-normal mt-1">{member.position}</div>
                    </div>
                  </div>

                  {/* Actions & Badge row */}
                  <div className="flex flex-col gap-2 pt-2.5 border-t border-cream-200/50">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider ${
                        member.commission === 'Inti' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        member.commission === 'A' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        member.commission === 'B' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        member.commission === 'C' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        member.commission === 'D' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        member.commission === 'E' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {member.commission === 'Inti' ? 'Inti' : `Komisi ${member.commission}`}
                      </span>

                      <button
                        onClick={async () => {
                          const newStatus = member.status === 'Demisioner' ? 'Aktif' : 'Demisioner';
                          try {
                            const { error } = await supabase
                              .from('members')
                              .update({ status: newStatus })
                              .eq('id', member.id);
                            if (error) throw error;
                            setSuccessMessage(`Status ${member.name} berhasil diubah menjadi ${newStatus === 'Demisioner' ? 'Purna Bakti' : 'Aktif'}!`);
                            await fetchMembers(true);
                          } catch (err: any) {
                            setErrorMessage('Gagal mengubah status: ' + err.message);
                          }
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-0.5"
                        title={member.status === 'Demisioner' ? 'Aktifkan Kembali' : 'Demisionkan (Purna Bakti)'}
                      >
                        <i className={`ph-duotone ${member.status === 'Demisioner' ? 'ph-briefcase' : 'ph-graduation-cap'} text-sm`}></i>
                        {member.status === 'Demisioner' ? 'Aktifkan' : 'Purna'}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-3.5 pt-1">
                      <button
                        onClick={() => {
                          setEditingId(member.id);
                          setName(member.name);
                          setPosition(member.position);
                          setClassName(member.class);
                          setCommission(member.commission);
                          setGender(member.gender || 'Laki-laki');
                          setMemberStatus(member.status || 'Aktif');
                          setGeneration(member.generation || 'Angkatan I');
                          
                          const match = member.avatar_url?.match(/9\.x\/([^/]+)\/svg\?seed=([^&]+)/);
                          if (match) {
                            setAvatarStyle(match[1]);
                            setIdenticonSeed(decodeURIComponent(match[2]));
                          } else {
                            setAvatarStyle('identicon');
                            setIdenticonSeed('Parchment');
                          }
                          
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setIsCommOpen(false);
                          setIsPosOpen(false);
                          setIsStyleOpen(false);
                          setIsStatusOpen(false);
                          scrollToForm();
                        }}
                        className={`text-xs font-bold cursor-pointer hover:underline ${
                          editingId === member.id
                            ? 'text-amber-600'
                            : 'text-cream-600 hover:text-cream-700'
                        }`}
                      >
                        {editingId === member.id ? '✎ Editing...' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Re-Generasi Modal Overlay */}
      {isRegenOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cozy-paper-card max-w-md w-full p-6 shadow-2xl border-2 border-amber-800/20 relative animate-fadeIn">
            <button
              onClick={() => setIsRegenOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer hover:scale-105 transition duration-150"
            >
              <i className="ph-bold ph-x text-lg"></i>
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <i className="ph-duotone ph-gear-six text-amber-600 text-xl"></i>
              Smart Re-Generasi
            </h3>
            
            {regenStep === 'options' && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Fitur ini didesain untuk mempermudah transisi kepengurusan secara massal pada akhir masa jabatan. Silakan pilih opsi otomatisasi di bawah ini:
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setRegenStep('class12')}
                    className="w-full text-left p-3.5 bg-cream-50 hover:bg-cream-100/80 border border-cream-300/85 rounded-xl transition duration-200 cursor-pointer group flex items-start gap-3"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 group-hover:bg-amber-200 transition">
                      <i className="ph-duotone ph-graduation-cap text-lg"></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">1. Demisionkan Kelas XII</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Otomatis mengubah status seluruh pengurus aktif kelas XII menjadi 'Purna Bakti'.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setRegenStep('all-demision')}
                    className="w-full text-left p-3.5 bg-cream-50 hover:bg-cream-100/80 border border-cream-300/85 rounded-xl transition duration-200 cursor-pointer group flex items-start gap-3"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 group-hover:bg-amber-200 transition">
                      <i className="ph-duotone ph-users-three text-lg"></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">2. Peremajaan Kepengurusan</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Demisionkan seluruh pengurus aktif ke angkatan tertentu untuk menyambut pengurus baru.</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {regenStep === 'class12' && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-850 font-medium">
                  Sistem akan mendeteksi pengurus aktif yang kelasnya diawali dengan kata <strong className="font-mono">"XII"</strong> (misal: XII-F1, XII-F5) dan mengubah statusnya menjadi <strong className="uppercase">Purna Bakti</strong>.
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  Demisionkan massal pengurus kelas XII? Ga bisa balik lagi ya.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setRegenStep('options')}
                    className="flex-1 bg-cream-100 hover:bg-cream-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer border border-cream-300 text-center"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleRegenClass12}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center shadow-md active:scale-95"
                  >
                    Ya, Jalankan
                  </button>
                </div>
              </div>
            )}

            {regenStep === 'all-demision' && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                  Tindakan ini akan mengarsipkan <strong>seluruh pengurus aktif</strong> (kelas X, XI, XII) menjadi status <strong className="uppercase">Purna Bakti</strong> dengan label Angkatan yang Anda tentukan di bawah ini.
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Tentukan Label Angkatan Purna</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Angkatan I"
                    className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 leading-normal"
                    value={regenGenInput}
                    onChange={(e) => setRegenGenInput(e.target.value)}
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  Data angkatan udah bener? Demisionkan pengurus aktif sekarang?
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setRegenStep('options')}
                    className="flex-1 bg-cream-100 hover:bg-cream-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer border border-cream-300 text-center"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleRegenAllActive}
                    disabled={!regenGenInput.trim()}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center shadow-md active:scale-95"
                  >
                    Ya, Jalankan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              Smart Batch Import Pengurus
            </h3>
            
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              Salin-tempel baris data pengurus Anda di bawah ini secara massal. Format per baris:<br />
              <strong className="font-mono text-amber-800">Nama | Jabatan | Kelas | Komisi (Opsional) | Gender (Opsional)</strong><br />
              *Contoh: <code className="font-mono text-slate-600 bg-cream-50 px-1 py-0.5 rounded">Siti Nurasyiah \| Sekretaris I \| XI-F1 \| Inti \| Perempuan</code>
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
