import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Position {
  id: string;
  title: string;
  parent_id: string | null;
  order_index: number;
  commission: string;
}

interface Member {
  id: string;
  name: string;
  position: string;
}

export default function ReactPositionTree() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [commission, setCommission] = useState('Inti');
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified "Atasan Jabatan" dropdown value
  // '__INTI__' = masuk jajaran Inti tanpa atasan (root)
  // any position id = jadikan jabatan tersebut sebagai atasan
  const [parentSelection, setParentSelection] = useState<string>('__INTI__');

  // Derive commission + parentId from the unified dropdown selection
  const applyParentSelection = (value: string) => {
    setParentSelection(value);
    if (value === '__INTI__') {
      setCommission('Inti');
      setParentId('');
    } else {
      const parent = positions.find(p => p.id === value);
      if (parent) {
        setCommission(parent.commission);
        setParentId(value);
      }
    }
  };

  // Custom Dropdown States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectContainerRef.current && !selectContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null); // synchronous ref to avoid async state race

  useEffect(() => {
    fetchData();

    // Set up realtime channel
    const channel = supabase
      .channel('positions-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'positions' },
        () => {
          fetchPositionsOnly();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, memRes] = await Promise.all([
        supabase.from('positions').select('*').order('order_index', { ascending: true }),
        supabase.from('members').select('id, name, position')
      ]);

      if (posRes.error) throw posRes.error;
      if (memRes.error) throw memRes.error;

      if (posRes.data) setPositions(posRes.data);
      if (memRes.data) setMembers(memRes.data);
    } catch (err: any) {
      setErrorMessage('Gagal memuat data hirarki: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionsOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      if (data) setPositions(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setCommission('Inti');
    setParentId('');
    setParentSelection('__INTI__');
    setIsDropdownOpen(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: any = {
      title: title.trim(),
      commission,
      parent_id: parentId === '' ? null : parentId,
    };

    try {
      if (editingId) {
        // Prevent setting a position as its own parent
        if (parentId === editingId) {
          throw new Error('Jabatan tidak bisa memiliki dirinya sendiri sebagai atasan.');
        }

        const { error } = await supabase
          .from('positions')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMessage('Jabatan berhasil diperbarui!');
      } else {
        // Get max order index for new item
        const sameComm = positions.filter(p => p.commission === commission);
        const maxOrder = sameComm.reduce((max, p) => p.order_index > max ? p.order_index : max, -1);
        payload.order_index = maxOrder + 1;

        const { error } = await supabase
          .from('positions')
          .insert([payload]);

        if (error) throw error;
        setSuccessMessage('Jabatan baru berhasil ditambahkan!');
      }

      handleReset();
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, titleStr: string) => {
    // Check if any member is currently assigned to this position
    const assignedMembers = members.filter(m => m.position === titleStr);
    
    if (assignedMembers.length > 0) {
      const memberNames = assignedMembers.map(m => m.name).slice(0, 3).join(', ');
      const suffix = assignedMembers.length > 3 ? ` dan ${assignedMembers.length - 3} lainnya` : '';
      (window as any).showCozyConfirm(
        'Hapus Jabatan',
        `⚠️ PERINGATAN: Ada ${assignedMembers.length} pengurus (${memberNames}${suffix}) yang menempati jabatan "${titleStr}". Jika dihapus, mereka tetap terdaftar tetapi jabatannya harus diperbarui di CMS. Apakah Anda yakin ingin tetap menghapus jabatan ini?`,
        async () => {
          await executeDelete(id);
        }
      );
    } else {
      (window as any).showCozyConfirm(
        'Hapus Jabatan',
        `Apakah Anda yakin ingin menghapus jabatan "${titleStr}"?`,
        async () => {
          await executeDelete(id);
        }
      );
    }
  };

  const executeDelete = async (id: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Find the position title before deleting it
      const posToDelete = positions.find(p => p.id === id);
      if (!posToDelete) throw new Error('Jabatan tidak ditemukan.');

      // 1. Delete the position
      const { error } = await supabase.from('positions').delete().eq('id', id);
      if (error) throw error;

      // 2. Cascade update: set members with this position back to default 'Anggota'
      const { error: cascadeError } = await supabase
        .from('members')
        .update({ position: 'Anggota' })
        .eq('position', posToDelete.title);
      
      if (cascadeError) {
        console.error('Gagal melakukan cascade reset pengurus:', cascadeError);
      }

      setSuccessMessage(`Jabatan "${posToDelete.title}" berhasil dihapus dan posisi pengurus terkait di-reset ke "Anggota"!`);
      await fetchData();
    } catch (err: any) {
      setErrorMessage('Gagal menghapus jabatan: ' + err.message);
    }
  };

  // Build recursive tree from flat array for a specific commission
  const buildTree = (comm: string) => {
    const list = positions.filter(p => p.commission === comm);
    const roots: (Position & { children: any[] })[] = [];
    const idMap: { [key: string]: any } = {};

    list.forEach(p => {
      idMap[p.id] = { ...p, children: [] };
    });

    list.forEach(p => {
      const mapped = idMap[p.id];
      if (p.parent_id && idMap[p.parent_id]) {
        idMap[p.parent_id].children.push(mapped);
      } else {
        roots.push(mapped);
      }
    });

    // Sort root and children recursively based on order_index
    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => a.order_index - b.order_index);
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          sortTree(n.children);
        }
      });
    };

    sortTree(roots);
    return roots;
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;           // synchronous — guaranteed available on drop
    setDraggedId(id);                    // also update state for visual feedback
    e.dataTransfer.setData('text/plain', id); // required for browser compat
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    // Read from ref (synchronous) — avoids React async state race condition
    const draggedId = draggedIdRef.current;
    if (!draggedId || draggedId === targetId) return;
    draggedIdRef.current = null; // clear ref after use

    const dragged = positions.find(p => p.id === draggedId);
    const target = positions.find(p => p.id === targetId);

    if (!dragged || !target || dragged.commission !== target.commission) {
      // Reordering across commissions is not recommended via drag for tree integrity
      return;
    }

    const sameComm = positions
      .filter(p => p.commission === target.commission)
      .sort((a, b) => a.order_index - b.order_index);

    const draggedIdx = sameComm.findIndex(p => p.id === draggedId);
    const targetIdx = sameComm.findIndex(p => p.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const updated = [...sameComm];
    // Remove from old pos
    updated.splice(draggedIdx, 1);
    // Insert into target pos
    updated.splice(targetIdx, 0, dragged);

    // Save indexes in memory
    const updatedPositions = positions.map(p => {
      if (p.commission === target.commission) {
        const idx = updated.findIndex(item => item.id === p.id);
        return { ...p, order_index: idx };
      }
      return p;
    });

    setPositions(updatedPositions);

    try {
      const promises = updated.map((item, idx) => 
        supabase
          .from('positions')
          .update({ order_index: idx })
          .eq('id', item.id)
      );
      await Promise.all(promises);
      setSuccessMessage('Urutan jabatan diubah!');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage('Gagal memperbarui urutan: ' + err.message);
    }
  };

  // Recursive Tree Node Renderer
  const renderNode = (node: Position & { children: any[] }, depth = 0) => {
    const parentTitle = node.parent_id 
      ? positions.find(p => p.id === node.parent_id)?.title 
      : null;

    return (
      <div key={node.id} className="space-y-1">
        {/* Node Card */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.id)}
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-cream-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group tree-node-indent gap-2 sm:gap-4 ${
            depth > 0 ? 'border-l-4 border-l-amber-600/60' : ''
          }`}
          style={{ '--depth': depth } as React.CSSProperties}
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <i className="ph-bold ph-dots-six-vertical text-slate-400 text-sm select-none mt-1 shrink-0"></i>
            <div className="min-w-0 flex-1">
              <h5 className="text-sm font-black text-slate-800 flex flex-wrap items-center gap-1.5 leading-tight">
                {node.title}
                {depth === 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider shrink-0">ROOT</span>}
              </h5>
              {parentTitle && (
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                  Atasan Jabatan: <span className="font-bold text-slate-500">{parentTitle}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3.5 pt-2 sm:pt-0 border-t border-cream-200/50 sm:border-t-0 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => {
                setEditingId(node.id);
                setTitle(node.title);
                setCommission(node.commission);
                setParentId(node.parent_id || '');
                // Restore unified dropdown: root Inti nodes → __INTI__, others → their parent id
                setParentSelection(node.parent_id ? node.parent_id : '__INTI__');
                setErrorMessage(null);
              }}
              className="text-xs font-bold text-cream-600 hover:text-cream-700 hover:underline cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(node.id, node.title)}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </div>

        {/* Child Nodes */}
        {node.children && node.children.length > 0 && (
          <div className="relative pl-3 mt-1.5 space-y-1">
            {/* Thread Line connecting sub-items */}
            <div className="absolute left-[3px] top-0 bottom-4 w-[1px] bg-amber-800/15"></div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const commissionsList = ['Inti', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1">
      {/* Form Card */}
      <div className="cozy-paper-card p-6 shadow-md border border-cream-200 self-start">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          {editingId ? (
            <>
              <i className="ph-duotone ph-pencil-line text-cream-600 text-lg"></i> Edit Jabatan
            </>
          ) : (
            <>
              <i className="ph-duotone ph-push-pin text-cream-600 text-lg"></i> Tambah Jabatan Baru
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Nama Jabatan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Koordinator Komisi X"
              className="w-full bg-white border border-cream-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider font-mono">Atasan Jabatan</label>
            <div className="relative" ref={selectContainerRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-cream-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-cream-500 focus:ring-2 focus:ring-cream-500/10 transition duration-200 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99] font-medium"
              >
                <span className="truncate">
                  {parentSelection === '__INTI__' 
                    ? '— INTI (Masuk Jajaran Inti) —' 
                    : positions.find(p => p.id === parentSelection)?.title || 'Pilih atasan...'
                  }
                </span>
                <i className={`ph-bold ${isDropdownOpen ? 'ph-caret-up' : 'ph-caret-down'} text-slate-400 text-sm transition-transform duration-200`}></i>
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-cream-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-cream-100/40">
                  <div
                    onClick={() => {
                      applyParentSelection('__INTI__');
                      setIsDropdownOpen(false);
                    }}
                    className={`px-3.5 py-2.5 text-xs text-slate-800 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition font-bold ${
                      parentSelection === '__INTI__' ? 'bg-amber-50/70 text-amber-900 font-black' : ''
                    }`}
                  >
                    — INTI (Masuk Jajaran Inti) —
                  </div>

                  {commissionsList.map(comm => {
                    const group = positions.filter(p => p.commission === comm && p.id !== editingId);
                    if (group.length === 0) return null;
                    const label = comm === 'Inti' ? 'Jajaran Inti' : `Komisi ${comm}`;
                    return (
                      <div key={comm} className="py-1">
                        <div className="px-3.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-cream-50/50">
                          {label}
                        </div>
                        {group.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              applyParentSelection(p.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-5 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition flex items-center justify-between ${
                              parentSelection === p.id ? 'bg-amber-50/70 text-amber-900 font-extrabold' : ''
                            }`}
                          >
                            <span>{p.title}</span>
                            {parentSelection === p.id && (
                              <i className="ph-bold ph-check text-amber-600 text-xs shrink-0"></i>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info chip: tampilkan jajaran yang akan diterapkan */}
            <p className="text-[10px] font-mono text-slate-400 mt-1.5">
              Jajaran: <span className="font-bold text-amber-700">
                {commission === 'Inti' ? 'Inti' : `Komisi ${commission}`}
              </span>
              {parentId && (
                <> · Atasan: <span className="font-bold text-slate-500">
                  {positions.find(p => p.id === parentId)?.title}
                </span></>
              )}
            </p>
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
              {isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Jabatan'}
            </button>
          </div>
        </form>
      </div>

      {/* Tree Visualization Card */}
      <div className="lg:col-span-2 cozy-paper-card p-6 shadow-md border border-cream-200 space-y-6">
        <div className="flex justify-between items-center border-b border-cream-200 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <i className="ph-duotone ph-tree-structure text-cream-600 text-xl"></i>
              Hirarki Jabatan & Organogram
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Drag item untuk reorder urutan. Induk posisi mengatur relasi anak.</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-cream-700 border border-cream-300 rounded-xl transition text-xs font-semibold cursor-pointer shadow-sm"
          >
            Refresh
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <svg className="animate-spin h-8 w-8 text-cream-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500 text-xs font-medium">Menganyam rantai jabatan...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {commissionsList.map(comm => {
              const tree = buildTree(comm);
              if (tree.length === 0) return null;

              return (
                <div key={comm} className="space-y-3 p-4 bg-cream-50/30 rounded-2xl border border-cream-200/60 shadow-inner">
                  <h4 className="text-xs font-black uppercase font-mono tracking-wider text-amber-900/70 flex items-center gap-1.5 border-b border-cream-200 pb-1.5">
                    <i className="ph-duotone ph-crown text-amber-700/60 text-sm"></i> Rantai Komisi: {comm}
                  </h4>
                  <div className="space-y-2 mt-2">
                    {tree.map(node => renderNode(node))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
