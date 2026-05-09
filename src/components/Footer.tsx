import { MapPin, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-12 bg-[var(--bg-card)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Localização */}
          <div className="flex gap-3">
            <MapPin size={18} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-0.5">Onde estamos</p>
              <p className="text-sm text-[var(--text-muted)]">Av. Marcelino Pires, 3600</p>
              <p className="text-sm text-[var(--text-muted)]">Shopping Avenida Center</p>
              <p className="text-sm text-[var(--text-muted)]">Dourados – MS</p>
            </div>
          </div>

          {/* Horários */}
          <div className="flex gap-3">
            <Clock size={18} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-0.5">Horário de funcionamento</p>
              <p className="text-sm text-[var(--text-muted)]">Seg – Sex: 11h às 21h30</p>
              <p className="text-sm text-[var(--text-muted)]">Sábado: 11h às 21h45</p>
              <p className="text-sm text-[var(--text-muted)]">Domingo: 11h às 21h00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Plataforma criada e desenvolvida por{' '}
            <span className="font-semibold text-[var(--text)]">Hive Marketing Digital</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
