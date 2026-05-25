import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AspirationPayload {
  name: string;
  class: string;
  content: string;
}

interface ClassOption {
  name: string;
  grade: string;
}

export default function ReactAspirasiForm() {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const defaultClasses: ClassOption[] = [
    ...Array.from({ length: 11 }, (_, i) => ({ name: `X-E${i + 1}`, grade: 'X' })),
    ...Array.from({ length: 10 }, (_, i) => ({ name: `XI-F${i + 1}`, grade: 'XI' })),
    ...Array.from({ length: 10 }, (_, i) => ({ name: `XII-F${i + 1}`, grade: 'XII' }))
  ];

  useEffect(() => {
    async function loadClasses() {
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
          setClasses(defaultClasses);
        }
      } catch (err) {
        console.error('Gagal memuat kelas:', err);
        setClasses(defaultClasses);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleSyncOfflineData);
    return () => window.removeEventListener('online', handleSyncOfflineData);
  }, []);

  const handleSyncOfflineData = async () => {
    const queuedData = localStorage.getItem('mpk_pending_aspirations');
    if (!queuedData) return;

    const items: AspirationPayload[] = JSON.parse(queuedData);
    if (items.length === 0) return;

    setStatus({ type: 'info', message: 'Koneksi kembali terdeteksi. Mensinkronisasi aspirasi tertunda...' });

    for (const item of items) {
      try {
        await submitAspiration(item);
      } catch (err) {
        console.error('Failed to sync item:', item);
      }
    }

    localStorage.removeItem('mpk_pending_aspirations');
    setStatus({ type: 'success', message: 'Semua aspirasi tertunda berhasil disinkronisasikan!' });
  };

  const submitAspiration = async (payload: AspirationPayload) => {
    const response = await fetch('/api/aspirations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    // ── ENFORCE 1-HOUR DEVICE LOCK PER USER (LOCAL STORAGE) ──
    const lastSubmitTime = localStorage.getItem('mpk_last_aspiration_time');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 Jam

    if (lastSubmitTime) {
      const elapsed = now - parseInt(lastSubmitTime);
      if (elapsed < oneHour) {
        const remainingMinutes = Math.ceil((oneHour - elapsed) / (60 * 1000));
        setStatus({
          type: 'error',
          message: `Demi keamanan, Anda hanya dapat mengirim 1 aspirasi setiap 1 jam. Silakan coba lagi dalam ${remainingMinutes} menit.`
        });
        setIsSubmitting(false);
        return;
      }
    }

    const payload: AspirationPayload = { name: name || 'Anonim', class: className, content };

    try {
      if (!navigator.onLine) {
        const currentQueue = localStorage.getItem('mpk_pending_aspirations');
        const queue = currentQueue ? JSON.parse(currentQueue) : [];
        queue.push(payload);
        localStorage.setItem('mpk_pending_aspirations', JSON.stringify(queue));

        setStatus({
          type: 'info',
          message: 'Koneksi terputus. Aspirasi Anda disimpan secara lokal dan akan terkirim otomatis saat internet pulih.',
        });
        setName('');
        setClassName('');
        setContent('');
        return;
      }

      await submitAspiration(payload);
      
      // Simpan waktu pengiriman berhasil untuk mengunci perangkat selama 1 jam
      localStorage.setItem('mpk_last_aspiration_time', Date.now().toString());
      
      document.dispatchEvent(new CustomEvent('aspiration-success'));
      setStatus({ type: 'success', message: 'Aspirasi Anda berhasil terkirim. Terima kasih atas masukan berharga Anda.' });
      setName('');
      setClassName('');
      setContent('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Gagal mengirim aspirasi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 500 - content.length;
  const inkPercentage = (remainingChars / 500) * 100;
  const isAnon = name.trim() === '';

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5 p-8 bg-white border border-cream-300 rounded-2xl shadow-md relative overflow-hidden">
        {/* Dynamic visual Wax Seal in top corner */}
        <div className="absolute top-4 right-4 transition-all duration-300 hover:scale-110 select-none hidden sm:block">
          {isAnon ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-700/10 border border-red-700/20 rounded-full text-[9px] font-mono font-bold text-red-800 animate-pulse">
              <i className="ph-duotone ph-shield-checkered text-xs text-red-700"></i>
              <span>SEALED & ANONIM</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-600/10 border border-amber-600/20 rounded-full text-[9px] font-mono font-bold text-amber-800">
              <i className="ph-duotone ph-user-check text-xs text-amber-600"></i>
              <span>SURAT TERCATAT</span>
            </div>
          )}
        </div>

        <div className="space-y-1 pr-12">
          <h3 className="text-xl font-black text-slate-900 bg-gradient-to-r from-cream-500 to-amber-700 bg-clip-text text-transparent uppercase tracking-wide flex items-center gap-2">
            Sampaikan Aspirasi Anda
          </h3>
          <p className="text-xs text-slate-500 font-light">
            Gunakan hak suara Anda untuk membantu mewujudkan sekolah yang lebih berdaya dan transparan.
          </p>
        </div>

        {status && (
          <div className={`p-4 rounded-xl text-xs font-semibold border transition-all duration-300 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
            status.type === 'error' ? 'bg-red-50 text-red-700 border-red-300' :
            'bg-amber-50 text-amber-700 border-amber-300'
          }`}>
            {status.message}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Nama Lengkap <span className="text-[9px] font-normal lowercase text-slate-400 font-mono tracking-wide">(inisial / kosongkan jika ingin anonim)</span>
            </label>
            <input 
              type="text" 
              placeholder="Bebas" 
              className="w-full bg-cream-100/30 border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-1 focus:ring-cream-500 transition duration-200" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Kelas <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full bg-cream-100/30 border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-1 focus:ring-cream-500 transition duration-200 cursor-pointer font-medium"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            >
              <option value="">-- Pilih Kelas Anda --</option>
              {['X', 'XI', 'XII'].map(grade => {
                const gradeClasses = classes.filter(c => c.grade === grade);
                if (gradeClasses.length === 0) return null;
                return (
                  <optgroup key={grade} label={`Tingkat ${grade} (Kelas ${grade === 'X' ? '10' : grade === 'XI' ? '11' : '12'})`}>
                    {gradeClasses.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Isi Aspirasi <span className="text-red-500">*</span>
            </label>
            <textarea 
              required 
              rows={4} 
              maxLength={500}
              placeholder="Silakan mengeluh tentang kelas yang panas, peperangan antar individu, program OSIS yang kurang asik, atau curhat masalah percintaan sekolah. Kami tampung, tapi kalo soal perbaikan tetap butuh tanda tangan kepala sekolah..." 
              className="w-full bg-cream-100/30 border border-cream-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-1 focus:ring-cream-500 transition duration-200 resize-none mb-1" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />
            {/* Inkwell Character Limit Meter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="ph-bold ph-pencil-simple-line"></i>
                  Sisa Tinta Penulisan:
                </span>
                <span className={`font-bold ${remainingChars < 50 ? 'text-red-600 font-extrabold animate-pulse' : 'text-slate-500'}`}>
                  {remainingChars} / 500 karakter
                </span>
              </div>
              <div className="h-1.5 w-full bg-cream-100 rounded-full overflow-hidden border border-cream-200/50">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    remainingChars < 50 ? 'bg-red-600' :
                    remainingChars < 150 ? 'bg-amber-500' :
                    'bg-slate-700'
                  }`}
                  style={{ width: `${inkPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer Action Row with visual stamp badge */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Mobile visible Wax Seal */}
          <div className="w-full sm:hidden flex justify-center select-none mb-1">
            {isAnon ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-700/10 border border-red-700/20 rounded-full text-[9px] font-mono font-bold text-red-800">
                <i className="ph-duotone ph-shield-checkered text-xs"></i>
                <span>SEALED & ANONIM</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-600/10 border border-amber-600/20 rounded-full text-[9px] font-mono font-bold text-amber-800">
                <i className="ph-duotone ph-user-check text-xs"></i>
                <span>SURAT TERCATAT</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full rounded-xl bg-slate-900 text-white font-bold py-3.5 transition duration-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-md text-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Sedang Mengirim...' : 'Kirim Aspirasi Saya'}
          </button>
        </div>
      </form>
    </div>
  );
}
