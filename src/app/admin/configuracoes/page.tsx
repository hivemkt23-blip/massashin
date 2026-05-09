'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Phone, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function ConfiguracoesAdmin() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingBanner, setSavingBanner] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [phones, setPhones] = useState<string[]>([])
  const [newPhone, setNewPhone] = useState('')
  const [savingPhones, setSavingPhones] = useState(false)
  const [savedPhones, setSavedPhones] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'banner_url').single(),
      supabase.from('site_settings').select('value').eq('key', 'notification_phones').single(),
    ]).then(([banner, phonesData]) => {
      setBannerUrl(banner.data?.value ?? null)
      setPhones(phonesData.data?.value ? JSON.parse(phonesData.data.value) : [])
    })
  }, [])

  // Banner
  const handleUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `banners/banner_principal.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setBannerUrl(data.publicUrl)
    }
    setUploading(false)
  }

  const handleSaveBanner = async () => {
    setSavingBanner(true)
    await supabase.from('site_settings').upsert({ key: 'banner_url', value: bannerUrl })
    setSavingBanner(false)
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  // Telefones
  const addPhone = () => {
    const clean = newPhone.replace(/\D/g, '')
    if (clean.length < 10) return
    if (phones.includes(clean)) return
    setPhones(prev => [...prev, clean])
    setNewPhone('')
  }

  const removePhone = (p: string) => setPhones(prev => prev.filter(x => x !== p))

  const handleSavePhones = async () => {
    setSavingPhones(true)
    await supabase.from('site_settings').upsert({ key: 'notification_phones', value: JSON.stringify(phones) })
    setSavingPhones(false)
    setSavedPhones(true)
    setTimeout(() => setSavedPhones(false), 3000)
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return p
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Configurações</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Personalize o site e gerencie notificações</p>
      </div>

      {/* Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-[var(--red)]" />
          <h2 className="font-semibold text-[var(--text)]">Banner principal</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Imagem exibida abaixo do nome do restaurante. Recomendado: 1440×360px, JPG ou PNG.
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--red)] transition-colors cursor-pointer overflow-hidden bg-[var(--bg-elevated)] flex items-center justify-center"
          style={{ minHeight: 160 }}
        >
          {bannerUrl ? (
            <>
              <Image src={bannerUrl} alt="Banner" width={800} height={200} className="w-full object-cover max-h-44" />
              <button
                onClick={e => { e.stopPropagation(); setBannerUrl(null) }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <Upload size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)]">{uploading ? 'Enviando...' : 'Clique para fazer upload do banner'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG ou WebP · Máx. 5MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveBanner} loading={savingBanner || uploading} className="min-w-[140px]">
            {savedBanner ? '✓ Salvo!' : 'Salvar banner'}
          </Button>
          {bannerUrl && (
            <button onClick={() => setBannerUrl(null)} className="text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors">
              Remover banner
            </button>
          )}
        </div>
      </div>

      {/* Telefones de notificação */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-[var(--red)]" />
          <h2 className="font-semibold text-[var(--text)]">Telefones para fechamento de caixa</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Ao fechar o caixa diário, o sistema enviará um resumo via WhatsApp para estes números.
          Somente o administrador master pode alterar esta lista.
        </p>

        {/* Lista de telefones */}
        <div className="space-y-2">
          {phones.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] italic">Nenhum telefone cadastrado.</p>
          )}
          {phones.map(p => (
            <div key={p} className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text)] font-mono">{formatPhone(p)}</span>
              </div>
              <button onClick={() => removePhone(p)} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar telefone */}
        <div className="flex gap-2">
          <input
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPhone()}
            placeholder="Ex: 67 99999-9999"
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors font-mono"
          />
          <button
            onClick={addPhone}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--red)] transition-colors"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Digite o número com DDD (ex: 67992350880). O WhatsApp será aberto automaticamente no seu navegador ao fechar o caixa.
        </p>

        <Button onClick={handleSavePhones} loading={savingPhones} className="min-w-[160px]">
          {savedPhones ? '✓ Salvo!' : 'Salvar telefones'}
        </Button>
      </div>
    </div>
  )
}
