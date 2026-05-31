import React, { useState, useEffect } from 'react';
import { supabase, logActivity } from '../lib/supabase';

interface HomepageConfig {
  key: string;
  value: string | null;
  json_value: any;
  description: string;
}

interface CommissionItem {
  id: string;
  title: string;
  desc: string;
}

interface ProkerItem {
  title: string;
  desc: string;
  icon: string;
}

export default function ReactHomepageEditor() {
  const [configs, setConfigs] = useState<HomepageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit mode & dirty tracking states
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDesc, setHeroDesc] = useState('');
  const [heroCta, setHeroCta] = useState('');
  const [heroSecCta, setHeroSecCta] = useState('');
  const [visi, setVisi] = useState('');
  const [misiList, setMisiList] = useState<string[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [prokers, setProkers] = useState<ProkerItem[]>([]);

  // Initial database values for dirty checking
  const [initialHeroBadge, setInitialHeroBadge] = useState('');
  const [initialHeroTitle, setInitialHeroTitle] = useState('');
  const [initialHeroDesc, setInitialHeroDesc] = useState('');
  const [initialHeroCta, setInitialHeroCta] = useState('');
  const [initialHeroSecCta, setInitialHeroSecCta] = useState('');
  const [initialVisi, setInitialVisi] = useState('');
  const [initialMisiList, setInitialMisiList] = useState<string[]>([]);
  const [initialCommissions, setInitialCommissions] = useState<CommissionItem[]>([]);
  const [initialProkers, setInitialProkers] = useState<ProkerItem[]>([]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_config')
        .select('*');

      if (error) throw error;
      if (data) {
        setConfigs(data);
        
        // Initialize form states
        const getVal = (key: string, fallback: string) => {
          const item = data.find(c => c.key === key);
          return item && item.value !== null ? item.value : fallback;
        };

        const getJson = (key: string, fallback: any) => {
          const item = data.find(c => c.key === key);
          return item && item.json_value ? item.json_value : fallback;
        };

        const hBadge = getVal('hero_badge_text', 'Majelis Perwakilan Kelas');
        const hTitle = getVal('hero_title', 'Suara Anda,\nMasa Depan Kita');
        const hDesc = getVal('hero_description', '');
        const hCta = getVal('hero_cta_text', '🌱 Sampaikan Aspirasi Sekarang');
        const hSecCta = getVal('hero_secondary_cta_text', 'Pelajari Peran Kami ↓');
        const vText = getVal('visi_text', '');
        const mList = getJson('misi_list', []);
        const cConfig = getJson('commissions_config', []);
        const pUtama = getJson('program_kerja_utama', []);

        setHeroBadge(hBadge); setInitialHeroBadge(hBadge);
        setHeroTitle(hTitle); setInitialHeroTitle(hTitle);
        setHeroDesc(hDesc); setInitialHeroDesc(hDesc);
        setHeroCta(hCta); setInitialHeroCta(hCta);
        setHeroSecCta(hSecCta); setInitialHeroSecCta(hSecCta);
        setVisi(vText); setInitialVisi(vText);
        setMisiList(mList); setInitialMisiList(mList);
        setCommissions(cConfig); setInitialCommissions(cConfig);
        setProkers(pUtama); setInitialProkers(pUtama);
      }
    } catch (err: any) {
      console.error('Error fetching homepage configs:', err);
      setMessage({ text: 'Gagal mengambil data konfigurasi beranda.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handle Misi List additions/deletions
  const handleAddMisi = () => {
    if (!isEditMode) return;
    setMisiList([...misiList, '']);
  };

  const handleUpdateMisi = (index: number, val: string) => {
    if (!isEditMode) return;
    const updated = [...misiList];
    updated[index] = val;
    setMisiList(updated);
  };

  const handleRemoveMisi = (index: number) => {
    if (!isEditMode) return;
    const updated = misiList.filter((_, i) => i !== index);
    setMisiList(updated);
  };

  // Handle Commission field updates
  const handleUpdateCommission = (index: number, field: keyof CommissionItem, val: string) => {
    if (!isEditMode) return;
    const updated = [...commissions];
    updated[index] = { ...updated[index], [field]: val };
    setCommissions(updated);
  };

  // Handle Proker updates
  const handleUpdateProker = (index: number, field: keyof ProkerItem, val: string) => {
    if (!isEditMode) return;
    const updated = [...prokers];
    updated[index] = { ...updated[index], [field]: val };
    setProkers(updated);
  };

  // State comparison for dirty checking
  const isDirty = (current: any, initial: any) => JSON.stringify(current) !== JSON.stringify(initial);

  const isFormDirty = 
    isDirty(heroBadge, initialHeroBadge) ||
    isDirty(heroTitle, initialHeroTitle) ||
    isDirty(heroDesc, initialHeroDesc) ||
    isDirty(heroCta, initialHeroCta) ||
    isDirty(heroSecCta, initialHeroSecCta) ||
    isDirty(visi, initialVisi) ||
    isDirty(misiList, initialMisiList) ||
    isDirty(commissions, initialCommissions) ||
    isDirty(prokers, initialProkers);

  // Navigation / Browser Unload Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = 'Anda memiliki perubahan yang belum disimpan di dasbor beranda. Yakin ingin keluar?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFormDirty]);

  // Cancel/Reset all changes
  const handleCancelAll = () => {
    const confirmCancel = (window as any).showCozyConfirm;
    const executeCancel = () => {
      setHeroBadge(initialHeroBadge);
      setHeroTitle(initialHeroTitle);
      setHeroDesc(initialHeroDesc);
      setHeroCta(initialHeroCta);
      setHeroSecCta(initialHeroSecCta);
      setVisi(initialVisi);
      setMisiList([...initialMisiList]);
      setCommissions(JSON.parse(JSON.stringify(initialCommissions)));
      setProkers(JSON.parse(JSON.stringify(initialProkers)));
      setIsEditMode(false);
      setMessage(null);
    };

    if (confirmCancel) {
      confirmCancel(
        'Batalkan Perubahan',
        'Batalin edit? Semua perubahan belum tersimpan bakal ilang.',
        executeCancel
      );
    } else {
      if (window.confirm('Batalkan semua perubahan?')) {
        executeCancel();
      }
    }
  };

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const payload = [
      { key: 'hero_badge_text', value: heroBadge, json_value: null },
      { key: 'hero_title', value: heroTitle, json_value: null },
      { key: 'hero_description', value: heroDesc, json_value: null },
      { key: 'hero_cta_text', value: heroCta, json_value: null },
      { key: 'hero_secondary_cta_text', value: heroSecCta, json_value: null },
      { key: 'visi_text', value: visi, json_value: null },
      { key: 'misi_list', value: null, json_value: misiList },
      { key: 'commissions_config', value: null, json_value: commissions },
      { key: 'program_kerja_utama', value: null, json_value: prokers }
    ];

    try {
      // Upsert each key in Supabase
      for (const item of payload) {
        const { error } = await supabase
          .from('homepage_config')
          .upsert({
            key: item.key,
            value: item.value,
            json_value: item.json_value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

        if (error) throw error;
      }

      // Sync initial database states to new saved values
      setInitialHeroBadge(heroBadge);
      setInitialHeroTitle(heroTitle);
      setInitialHeroDesc(heroDesc);
      setInitialHeroCta(heroCta);
      setInitialHeroSecCta(heroSecCta);
      setInitialVisi(visi);
      setInitialMisiList([...misiList]);
      setInitialCommissions(JSON.parse(JSON.stringify(commissions)));
      setInitialProkers(JSON.parse(JSON.stringify(prokers)));
      setIsEditMode(false);

      setMessage({ text: 'Konfigurasi beranda berhasil diperbarui secara dinamis!', type: 'success' });
      logActivity({ action: 'UPDATE_HOMEPAGE', entity_type: 'homepage_config', detail: 'Konfigurasi beranda diperbarui' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving homepage config:', err);
      setMessage({ text: `Gagal menyimpan perubahan: ${err.message || err}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const renderModifiedBadge = (fieldCurrent: any, fieldInitial: any) => {
    if (isDirty(fieldCurrent, fieldInitial)) {
      return (
        <span className="ml-2 inline-flex items-center text-[8px] bg-amber-50 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 font-bold font-mono uppercase tracking-wider animate-fadeIn">
          Modified
        </span>
      );
    }
    return null;
  };

  const getBorderClass = (fieldCurrent: any, fieldInitial: any) => {
    return isDirty(fieldCurrent, fieldInitial)
      ? 'border-amber-500 focus:border-amber-600 focus:ring-amber-500/10'
      : 'border-cream-300 focus:border-cream-500 focus:ring-cream-500/10';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-cream-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Memuat Konfigurasi Beranda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up pb-24" style={{ animationDuration: '0.4s' }}>
      
      {/* Alert Message */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="text-lg">{message.type === 'success' ? '🌲' : '🚨'}</span>
          <div className="text-xs font-medium leading-relaxed">{message.text}</div>
        </div>
      )}

      {/* GLOBAL EDIT MODE CONTROL BAR */}
      <div className="cozy-paper-card bg-[#FFFDF3] border-l-4 border-amber-600 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <i className="ph-duotone ph-shield-checkered text-amber-700 text-base"></i>
            Proteksi Editor Beranda
          </h4>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
            {isEditMode 
              ? '🔓 Mode pengeditan aktif. Silakan lakukan perubahan secara hati-hati.' 
              : '🔒 Baca-saja aktif secara default untuk mencegah suntingan tidak sengaja pada ponsel.'
            }
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setIsEditMode(!isEditMode);
            if (!isEditMode) {
              // Smooth scroll to first input
              setTimeout(() => {
                const firstInput = document.getElementById('hero-badge');
                firstInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (firstInput as HTMLInputElement)?.focus();
              }, 200);
            }
          }}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-1.5 select-none ${
            isEditMode 
              ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700' 
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-transparent'
          }`}
        >
          {isEditMode ? (
            <>
              <i className="ph-bold ph-lock-key-open"></i>
              Kunci Edit
            </>
          ) : (
            <>
              <i className="ph-bold ph-pencil-simple"></i>
              ✍️ Edit Dashboard
            </>
          )}
        </button>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        
        {/* SECTION 1: HERO CONFIG */}
        <div className="cozy-paper-card bg-white p-6 sm:p-8 rounded-2xl border border-cream-300/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-cream-200 pb-3">
            <i className="ph-duotone ph-megaphone text-cream-600 text-xl"></i>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-charcoal-900 font-mono">Bagian Hero Beranda</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Hero Badge */}
            <div className="space-y-2">
              <label htmlFor="hero-badge" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Teks Badge Atas
                {renderModifiedBadge(heroBadge, initialHeroBadge)}
              </label>
              <input
                id="hero-badge"
                type="text"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium leading-normal disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(heroBadge, initialHeroBadge)}`}
                required
                disabled={!isEditMode}
              />
            </div>

            {/* Hero Title */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="hero-title" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Judul Utama (Mendukung HTML)
                {renderModifiedBadge(heroTitle, initialHeroTitle)}
              </label>
              <textarea
                id="hero-title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                rows={2}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium font-mono leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(heroTitle, initialHeroTitle)}`}
                placeholder="Contoh: Suara Anda,<br/>\n<span>Masa Depan Kita</span>"
                required
                disabled={!isEditMode}
              />
              <span className="text-[9px] text-slate-400 italic block">Gunakan tag <code>&lt;br/&gt;</code> untuk memotong baris, dan gunakan tag span dengan class gradient untuk mewarnai teks secara estetis.</span>
            </div>

            {/* Hero Description */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="hero-desc" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Deskripsi Sub-Judul
                {renderModifiedBadge(heroDesc, initialHeroDesc)}
              </label>
              <textarea
                id="hero-desc"
                value={heroDesc}
                onChange={(e) => setHeroDesc(e.target.value)}
                rows={3}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(heroDesc, initialHeroDesc)}`}
                required
                disabled={!isEditMode}
              />
            </div>

            {/* CTA Text */}
            <div className="space-y-2">
              <label htmlFor="hero-cta" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Tombol Tindakan Utama (CTA)
                {renderModifiedBadge(heroCta, initialHeroCta)}
              </label>
              <input
                id="hero-cta"
                type="text"
                value={heroCta}
                onChange={(e) => setHeroCta(e.target.value)}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium leading-normal disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(heroCta, initialHeroCta)}`}
                required
                disabled={!isEditMode}
              />
            </div>

            {/* Secondary CTA Text */}
            <div className="space-y-2">
              <label htmlFor="hero-sec-cta" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Tombol Tindakan Sekunder
                {renderModifiedBadge(heroSecCta, initialHeroSecCta)}
              </label>
              <input
                id="hero-sec-cta"
                type="text"
                value={heroSecCta}
                onChange={(e) => setHeroSecCta(e.target.value)}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium leading-normal disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(heroSecCta, initialHeroSecCta)}`}
                required
                disabled={!isEditMode}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ABOUT, VISI & MISI */}
        <div className="cozy-paper-card bg-white p-6 sm:p-8 rounded-2xl border border-cream-300/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-cream-200 pb-3">
            <i className="ph-duotone ph-book-open text-cream-600 text-xl"></i>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-charcoal-900 font-mono">Visi & Misi</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Visi */}
            <div className="space-y-2">
              <label htmlFor="visi-text" className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                Pernyataan Visi
                {renderModifiedBadge(visi, initialVisi)}
              </label>
              <textarea
                id="visi-text"
                value={visi}
                onChange={(e) => setVisi(e.target.value)}
                rows={3}
                className={`w-full bg-cream-50/50 border rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 transition font-medium leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed ${getBorderClass(visi, initialVisi)}`}
                required
                disabled={!isEditMode}
              />
            </div>

            {/* Misi List (Dynamic Tagging / Input Array) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cream-200/50 pb-2">
                <label className="flex items-center text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                  Butir-Butir Misi
                  {renderModifiedBadge(misiList, initialMisiList)}
                </label>
                <button
                  type="button"
                  onClick={handleAddMisi}
                  className="inline-flex items-center gap-1 bg-cream-100 hover:bg-cream-200 border border-cream-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  disabled={!isEditMode}
                >
                  <i className="ph-bold ph-plus"></i> Tambah Misi
                </button>
              </div>

              {misiList.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-cream-300 rounded-2xl bg-cream-50/20">
                  <span className="text-2xl">🍃</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Belum ada butir misi ditambahkan.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {misiList.map((misi, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-cream-50/30 border border-cream-200/80 p-3 rounded-xl hover:border-cream-400 transition">
                      <span className="text-[10px] font-mono font-bold text-cream-700 bg-cream-100/85 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-cream-200 mt-1">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <textarea
                        value={misi}
                        onChange={(e) => handleUpdateMisi(idx, e.target.value)}
                        rows={2}
                        className="flex-1 bg-white border border-cream-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-400 focus:ring-2 focus:ring-cream-500/5 transition font-medium leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="Ketik deskripsi butir misi kesiswaan di sini..."
                        required
                        disabled={!isEditMode}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMisi(idx)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 transition shrink-0 cursor-pointer mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Hapus misi"
                        disabled={!isEditMode}
                      >
                        <i className="ph-bold ph-trash text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: PROGRAM KERJA UTAMA */}
        <div className="cozy-paper-card bg-white p-6 sm:p-8 rounded-2xl border border-cream-300/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-cream-200 pb-3">
            <i className="ph-duotone ph-briefcase text-cream-600 text-xl"></i>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-charcoal-900 font-mono">
                Program Kerja Utama
                {renderModifiedBadge(prokers, initialProkers)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {prokers.map((proker, idx) => (
              <div key={idx} className="bg-cream-50/30 border border-cream-200/80 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-cream-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <h4 className="text-xs font-bold text-slate-700 font-mono uppercase">Pilar Utama {idx + 1}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-400">File Ikon Minecraft:</span>
                    <input
                      type="text"
                      value={proker.icon}
                      onChange={(e) => handleUpdateProker(idx, 'icon', e.target.value)}
                      className="bg-white border border-cream-200 rounded px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 w-36 disabled:opacity-75"
                      required
                      disabled={!isEditMode}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">Nama Program</label>
                    <input
                      type="text"
                      value={proker.title}
                      onChange={(e) => handleUpdateProker(idx, 'title', e.target.value)}
                      className="w-full bg-white border border-cream-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-400 transition font-bold leading-normal disabled:opacity-75"
                      required
                      disabled={!isEditMode}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">Deskripsi Singkat</label>
                    <textarea
                      value={proker.desc}
                      onChange={(e) => handleUpdateProker(idx, 'desc', e.target.value)}
                      rows={2}
                      placeholder="Singkat aja, biar ga kepenuhan di beranda."
                      className="w-full bg-white border border-cream-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-400 transition font-medium leading-relaxed disabled:opacity-75"
                      required
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: KOMISI LEGISLATIF */}
        <div className="cozy-paper-card bg-white p-6 sm:p-8 rounded-2xl border border-cream-300/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-cream-200 pb-3">
            <i className="ph-duotone ph-scales text-cream-600 text-xl"></i>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-charcoal-900 font-mono">
                Komisi Legislatif (A - F)
                {renderModifiedBadge(commissions, initialCommissions)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commissions.map((comm, idx) => (
              <div key={comm.id} className="bg-cream-50/30 border border-cream-200/80 p-5 rounded-2xl space-y-3.5 relative">
                <div className="flex items-center justify-between border-b border-cream-200/50 pb-2">
                  <span className="text-[9px] font-black font-mono text-cream-700 bg-cream-100 border border-cream-200 px-2 py-0.5 rounded uppercase tracking-wider">Komisi {comm.id}</span>
                  <span className="text-xs select-none">⚖️</span>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Nama Komisi</label>
                    <input
                      type="text"
                      value={comm.title}
                      onChange={(e) => handleUpdateCommission(idx, 'title', e.target.value)}
                      className="w-full bg-white border border-cream-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-400 transition font-bold leading-normal disabled:opacity-75"
                      required
                      disabled={!isEditMode}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Fokus Tugas & Deskripsi</label>
                    <textarea
                      value={comm.desc}
                      onChange={(e) => handleUpdateCommission(idx, 'desc', e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-cream-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-cream-400 transition font-medium leading-relaxed disabled:opacity-75"
                      required
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </form>

      {/* STICKY BOTTOM ACTION BAR */}
      {isFormDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-[92%] bg-white/90 backdrop-blur-md border border-cream-300 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-45 animate-slideUp transition-all duration-300">
          <div className="flex items-center gap-2 text-left self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wider">
              Anda memiliki perubahan belum disimpan
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleCancelAll}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-700 border border-cream-400/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer select-none active:scale-[0.98]"
            >
              Batalkan Semua
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5 select-none active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <i className="ph-bold ph-floppy-disk"></i>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
