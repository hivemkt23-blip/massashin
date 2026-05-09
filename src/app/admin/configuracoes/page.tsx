'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function ConfiguracoesAdmin() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'banner_url').single()
      .then(({ data }) => setBannerUrl(data?.value ?? null))
  }, [])

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

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('site_settings').upsert({ key: 'banner_url', value: bannerUrl })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleRemove = () => setBannerUrl(null)

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Configurações</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Personalize a aparência do site</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-[var(--red)]" />
          <h2 className="font-semibold text-[var(--text)]">Banner principal</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Imagem exibida abaixo do nome do restaurante. Recomendado: 1440×360px, formato JPG ou PNG.
        </p>

        {/* Preview / upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--red)] transition-colors cursor-pointer overflow-hidden bg-[var(--bg-elevated)] flex items-center justify-center"
          style={{ minHeight: 180 }}
        >
          {bannerUrl ? (
            <>
              <Image src={bannerUrl} alt="Banner" width={800} height={200} className="w-full object-cover max-h-52" />
              <button
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <Upload size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)]">
                {uploading ? 'Enviando...' : 'Clique para fazer upload do banner'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG ou WebP · Máx. 5MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} loading={saving || uploading} className="min-w-[140px]">
            {saved ? '✓ Salvo!' : 'Salvar alterações'}
          </Button>
          {bannerUrl && (
            <button
              onClick={handleRemove}
              className="text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              Remover banner
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
