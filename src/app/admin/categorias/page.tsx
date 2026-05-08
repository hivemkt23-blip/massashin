'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import Button from '@/components/ui/Button'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

export default function CategoriasAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', display_order: '0', active: true })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', slug: '', display_order: String(categories.length + 1), active: true })
    setEditing(null)
    setModal('create')
  }

  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, display_order: String(c.display_order), active: c.active })
    setEditing(c)
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { name: form.name, slug: form.slug.toLowerCase().replace(/\s+/g, '-'), display_order: parseInt(form.display_order), active: form.active }
    if (modal === 'edit' && editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('categories').insert(payload)
    }
    await load()
    setModal(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria? Os produtos vinculados perderão a categoria.')) return
    await supabase.from('categories').delete().eq('id', id)
    await load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Categorias</h1>
          <p className="text-sm text-[var(--text-muted)]">{categories.length} categorias</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Nova categoria</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {['Ordem', 'Nome', 'Slug', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="py-3 px-4 text-[var(--text-muted)] text-xs">{c.display_order}</td>
                  <td className="py-3 px-4 font-medium text-[var(--text)]">{c.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[var(--text-muted)]">{c.slug}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text)]">{modal === 'create' ? 'Nova categoria' : 'Editar categoria'}</h2>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Nome</label>
                <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-') })) }}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Slug (URL)</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text)] focus:outline-none focus:border-[var(--red)] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Ordem de exibição</label>
                <input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)] transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cat-active" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 accent-red-600" />
                <label htmlFor="cat-active" className="text-sm text-[var(--text)]">Categoria ativa</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setModal(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
