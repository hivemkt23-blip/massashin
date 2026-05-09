'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Plus, Pencil, Trash2, Upload, X, Search, Wand2 } from 'lucide-react'
import Image from 'next/image'

export default function ProdutosAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [convertModal, setConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertPreview, setConvertPreview] = useState<{ id: string; name: string; before: string; after: string }[]>([])

  const [form, setForm] = useState({
    name: '', description: '', price: '', original_price: '',
    category_id: '', serves: '1', image_url: '', active: true, featured: false,
  })

  const supabase = createClient()

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*').order('display_order'),
      supabase.from('categories').select('*').order('display_order'),
    ])
    setProducts((prods as Product[]) ?? [])
    setCategories((cats as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', description: '', price: '', original_price: '', category_id: categories[0]?.id ?? '', serves: '1', image_url: '', active: true, featured: false })
    setEditing(null)
    setModal('create')
  }

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description ?? '', price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : '',
      category_id: p.category_id, serves: String(p.serves),
      image_url: p.image_url ?? '', active: p.active, featured: (p as any).featured ?? false,
    })
    setEditing(p)
    setModal('edit')
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(prev => ({ ...prev, image_url: data.publicUrl }))
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      category_id: form.category_id,
      serves: parseInt(form.serves),
      image_url: form.image_url || null,
      active: form.active,
      featured: form.featured,
    }

    if (modal === 'edit' && editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(payload)
    }

    await load()
    setModal(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return
    await supabase.from('products').delete().eq('id', id)
    await load()
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category_id === filterCat
    return matchSearch && matchCat
  })

  const catName = (id: string) => categories.find(c => c.id === id)?.name ?? '—'

  const openConvertModal = () => {
    const preview = products
      .filter(p => p.description && p.description.includes(', '))
      .map(p => ({
        id: p.id,
        name: p.name,
        before: p.description!,
        after: p.description!.replace(/, /g, '\n'),
      }))
    setConvertPreview(preview)
    setConvertModal(true)
  }

  const handleConvertAll = async () => {
    setConverting(true)
    await Promise.all(
      convertPreview.map(p =>
        supabase.from('products').update({ description: p.after }).eq('id', p.id)
      )
    )
    await load()
    setConverting(false)
    setConvertModal(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Produtos</h1>
          <p className="text-sm text-[var(--text-muted)]">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openConvertModal}
            title="Converter vírgulas em quebras de linha nas descrições"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--red)] transition-colors"
          >
            <Wand2 size={15} /> Formatar descrições
          </button>
          <Button onClick={openCreate}>
            <Plus size={16} /> Novo produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)] transition-colors"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {['Produto', 'Categoria', 'Preço', 'Serve', 'Ativo', 'Ações'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-elevated)]">
                          <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-lg flex-shrink-0">🍣</div>
                      )}
                      <span className="font-medium text-[var(--text)] line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[var(--text-muted)]">{catName(p.category_id)}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[var(--red)]">{formatCurrency(p.price)}</span>
                    {p.original_price && <span className="text-xs text-[var(--text-muted)] line-through ml-1">{formatCurrency(p.original_price)}</span>}
                  </td>
                  <td className="py-3 px-4 text-xs text-[var(--text-muted)]">{p.serves}p</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">Nenhum produto encontrado</div>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <h2 className="font-bold text-[var(--text)]">{modal === 'create' ? 'Novo produto' : 'Editar produto'}</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {/* Upload de imagem */}
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Foto do produto</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative h-32 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--red)] transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-[var(--bg-elevated)]"
                >
                  {form.image_url ? (
                    <Image src={form.image_url} alt="preview" fill className="object-cover" sizes="512px" />
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-[var(--text-muted)] mb-1" />
                      <p className="text-xs text-[var(--text-muted)]">{uploading ? 'Enviando...' : 'Clique para fazer upload'}</p>
                    </div>
                  )}
                  {form.image_url && (
                    <button
                      onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, image_url: '' })) }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </div>

              <Field label="Nome *">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-admin" placeholder="Nome do produto" />
              </Field>
              <Field label="Descrição">
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="input-admin resize-none" placeholder="Descreva o produto..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço *">
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-admin" placeholder="0,00" />
                </Field>
                <Field label="Preço original (se promoção)">
                  <input type="number" step="0.01" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} className="input-admin" placeholder="0,00" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria *">
                  <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className="input-admin">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Serve (pessoas)">
                  <input type="number" min="1" value={form.serves} onChange={e => setForm(p => ({ ...p, serves: e.target.value }))} className="input-admin" />
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 accent-red-600" />
                <label htmlFor="active" className="text-sm text-[var(--text)]">Produto ativo (visível no cardápio)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                <label htmlFor="featured" className="text-sm text-[var(--text)]">⭐ Destaque (aparece na seção Destaques)</label>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)] flex-shrink-0">
              <Button variant="outline" onClick={() => setModal(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} loading={saving || uploading} className="flex-1">
                {modal === 'create' ? 'Criar produto' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal converter descrições */}
      {convertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConvertModal(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <h2 className="font-bold text-[var(--text)]">Formatar descrições</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Substitui <code className="bg-[var(--bg-elevated)] px-1 rounded">, </code> por quebra de linha em {convertPreview.length} produto(s)
                </p>
              </div>
              <button onClick={() => setConvertModal(false)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {convertPreview.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-8">Nenhuma descrição com vírgulas encontrada.</p>
              ) : (
                convertPreview.map(p => (
                  <div key={p.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                      <p className="text-sm font-medium text-[var(--text)]">{p.name}</p>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                      <div className="p-3">
                        <p className="text-xs text-[var(--text-muted)] mb-1 font-semibold">ANTES</p>
                        <p className="text-xs text-[var(--text)] whitespace-pre-line">{p.before}</p>
                      </div>
                      <div className="p-3 bg-green-950/20">
                        <p className="text-xs text-green-400 mb-1 font-semibold">DEPOIS</p>
                        <p className="text-xs text-[var(--text)] whitespace-pre-line">{p.after}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {convertPreview.length > 0 && (
              <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)] flex-shrink-0">
                <Button variant="outline" onClick={() => setConvertModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleConvertAll} loading={converting} className="flex-1">
                  Aplicar em todos ({convertPreview.length} produtos)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .input-admin {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text);
          transition: border-color 0.15s;
        }
        .input-admin:focus { outline: none; border-color: var(--red); }
        .input-admin::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
      {children}
    </div>
  )
}
