import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsService } from '@/services/organizations'
import type { OrganizationFeatures } from '@/types/organization'
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

// ─── Shared sub-components ────────────────────────────────────────────────────

function ColorInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="color"
        value={value.startsWith('#') && value.length >= 7 ? value.slice(0, 7) : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 36, padding: 3, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: 'monospace', flex: 1 }}
        placeholder={placeholder ?? '#000000'}
      />
    </div>
  )
}

function TabBarPreview({ branding }: { branding: import('@/types/organization').OrganizationBranding }) {
  const bg = branding.tabBarColor ?? '#ffffff'
  const active = branding.tabBarActiveColor ?? branding.primaryColor ?? '#031249'
  const inactive = branding.tabBarInactiveColor ?? '#9E9E9E'
  const tabs = ['Agenda', 'Speakers', 'Hoteles', 'Fotos']

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Vista previa</p>
      <div style={{
        background: bg,
        borderRadius: 12,
        border: '1px solid var(--border)',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        {tabs.map((label, i) => {
          const isActive = i === 0
          const color = isActive ? active : inactive
          return (
            <div key={label} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px 8px',
              position: 'relative',
              gap: 3,
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 8, right: 8,
                  height: 2,
                  borderRadius: 2,
                  background: active,
                }} />
              )}
              <div style={{ width: 20, height: 20, borderRadius: 4, background: color, opacity: 0.9 }} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type BooleanFeatureKey = keyof Omit<OrganizationFeatures, 'defaultModule'>

const FEATURE_LABELS: Record<BooleanFeatureKey, string> = {
  agenda:      'Agenda',
  speakers:    'Speakers',
  survey:      'Encuestas',
  certificate: 'Certificados',
  documents:   'Documentos',
  news:        'Noticias',
  highlights:  'Highlights',
  posters:     'Posters',
  rooms:       'Salas',
  traveler:    'Viajes',
  hotels:      'Hoteles',
  attendance:  'Asistencia',
  usefulInfo:  'Info útil',
  photos:      'Fotos',
}

// Módulos que tienen tab propio en la app móvil — candidatos a "módulo por defecto"
const TAB_MODULES: { key: BooleanFeatureKey; label: string }[] = [
  { key: 'agenda',      label: 'Agenda' },
  { key: 'speakers',    label: 'Speakers' },
  { key: 'traveler',    label: 'Viajes' },
  { key: 'hotels',      label: 'Hoteles' },
  { key: 'attendance',  label: 'Asistencia' },
  { key: 'usefulInfo',  label: 'Info útil' },
  { key: 'photos',      label: 'Fotos' },
]

type Tab = 'general' | 'features' | 'branding' | 'events'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('general')
  const [saved, setSaved] = useState(false)

  const { data: org, isLoading } = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsService.getById(id!),
    enabled: !!id,
  })

  const [features, setFeatures] = useState<OrganizationFeatures | null>(null)
  const [branding, setBranding] = useState(org?.branding ?? null)
  const [general, setGeneral] = useState({ name: '', slug: '', bundleIds: { ios: '', android: '' } })

  useEffect(() => {
    if (org) {
      setFeatures(org.features)
      setBranding(org.branding)
      setGeneral({
        name: org.name,
        slug: org.slug ?? '',
        bundleIds: { ios: org.bundleIds?.ios ?? '', android: org.bundleIds?.android ?? '' },
      })
    }
  }, [org])

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof organizationsService.update>[1]) =>
      organizationsService.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const handleSave = () => {
    if (tab === 'features') mutation.mutate({ features: features! })
    if (tab === 'branding') mutation.mutate({ branding: branding! })
    if (tab === 'general') mutation.mutate({ name: general.name, slug: general.slug, bundleIds: general.bundleIds })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 32, width: 200, background: '#f1f5f9', borderRadius: 8 }} />
        <div style={{ height: 300, background: '#f1f5f9', borderRadius: 14 }} />
      </div>
    )
  }

  if (!org) return <p>Organización no encontrada.</p>

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'features', label: 'Módulos' },
    { id: 'branding', label: 'Branding' },
    { id: 'events', label: 'Eventos' },
  ]

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/organizations" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'background .15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 style={{ marginBottom: 1 }}>{org.name}</h1>
          {org.slug && (
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>/{org.slug}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        gap: 0,
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => t.id === 'events' ? navigate(`/organizations/${id}/events`) : setTab(t.id)}
            style={{
              height: 40,
              padding: '0 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily: 'var(--font)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color .15s, border-color .15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {tab === 'general' && (
        <div className="card" style={{ padding: 24, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Nombre de la organización">
            <input
              value={general.name}
              onChange={(e) => setGeneral((g) => ({ ...g, name: e.target.value }))}
              placeholder="Mi Organización"
            />
          </Field>
          <Field label="Slug">
            <input
              value={general.slug}
              onChange={(e) => setGeneral((g) => ({ ...g, slug: e.target.value }))}
              placeholder="mi-organizacion"
            />
          </Field>
          <hr className="divider" />
          <h3>Bundle IDs</h3>
          <Field label="iOS">
            <input
              value={general.bundleIds.ios}
              onChange={(e) => setGeneral((g) => ({ ...g, bundleIds: { ...g.bundleIds, ios: e.target.value } }))}
              placeholder="com.empresa.app"
            />
          </Field>
          <Field label="Android">
            <input
              value={general.bundleIds.android}
              onChange={(e) => setGeneral((g) => ({ ...g, bundleIds: { ...g.bundleIds, android: e.target.value } }))}
              placeholder="com.empresa.app"
            />
          </Field>
        </div>
      )}

      {/* Tab: Features */}
      {tab === 'features' && features && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3>Módulos activos</h3>
              <p style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                Los cambios se reflejan inmediatamente en la app móvil.
              </p>
            </div>
            <div style={{ padding: '8px 0' }}>
              {(Object.keys(FEATURE_LABELS) as BooleanFeatureKey[]).map((key, i, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {FEATURE_LABELS[key]}
                  </span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!features[key]}
                      onChange={() => setFeatures((f) => f ? { ...f, [key]: !f[key] } : f)}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>Módulo por defecto</h3>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                Tab que ve el usuario al iniciar sesión. Solo se muestran los módulos habilitados arriba.
              </p>
            </div>
            <select
              value={features.defaultModule ?? ''}
              onChange={(e) =>
                setFeatures((f) => f ? { ...f, defaultModule: e.target.value || null } : f)
              }
              style={{ maxWidth: 240 }}
            >
              <option value="">— Primer tab habilitado —</option>
              {TAB_MODULES.filter((m) => features[m.key]).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tab: Branding */}
      {tab === 'branding' && branding && (
        <div className="card" style={{ padding: 24, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Nombre de la app">
            <input
              value={branding.appName ?? ''}
              onChange={(e) => setBranding((b) => b ? { ...b, appName: e.target.value } : b)}
              placeholder="Mi App"
            />
          </Field>
          <hr className="divider" />
          <h3>Colores generales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Color primario">
              <ColorInput
                value={branding.primaryColor}
                onChange={(v) => setBranding((b) => b ? { ...b, primaryColor: v } : b)}
              />
            </Field>
            <Field label="Color primario oscuro">
              <ColorInput
                value={branding.primaryDarkColor ?? '#020d30'}
                onChange={(v) => setBranding((b) => b ? { ...b, primaryDarkColor: v } : b)}
              />
            </Field>
            <Field label="Color secundario">
              <ColorInput
                value={branding.secondaryColor}
                onChange={(v) => setBranding((b) => b ? { ...b, secondaryColor: v } : b)}
              />
            </Field>
          </div>
          <hr className="divider" />
          <h3>Tab bar (app móvil)</h3>
          <p style={{ fontSize: '0.8125rem', margin: '0 0 12px' }}>
            Configura el aspecto de la barra de navegación inferior.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Fondo del tab bar">
              <ColorInput
                value={branding.tabBarColor ?? '#ffffff'}
                onChange={(v) => setBranding((b) => b ? { ...b, tabBarColor: v } : b)}
              />
            </Field>
            <Field label="Color tab activo">
              <ColorInput
                value={branding.tabBarActiveColor ?? branding.primaryColor}
                onChange={(v) => setBranding((b) => b ? { ...b, tabBarActiveColor: v } : b)}
                placeholder="Default: color primario"
              />
            </Field>
            <Field label="Color tabs inactivos">
              <ColorInput
                value={branding.tabBarInactiveColor ?? '#9E9E9E'}
                onChange={(v) => setBranding((b) => b ? { ...b, tabBarInactiveColor: v } : b)}
              />
            </Field>
          </div>
          {/* Preview del tab bar */}
          <TabBarPreview branding={branding} />
          <hr className="divider" />
          <Field label="URL del logo">
            <input
              value={branding.logoUrl ?? ''}
              onChange={(e) => setBranding((b) => b ? { ...b, logoUrl: e.target.value } : b)}
              placeholder="https://..."
            />
          </Field>
          {branding.logoUrl && (
            <div style={{
              padding: 12,
              background: 'var(--bg)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={branding.logoUrl} alt="Logo preview" style={{ height: 48, objectFit: 'contain' }} />
            </div>
          )}
        </div>
      )}

      {/* Save bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
      }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          <Save size={14} />
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {saved && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.875rem',
            color: 'var(--success)',
            fontWeight: 500,
          }}>
            <CheckCircle2 size={15} />
            Guardado correctamente
          </span>
        )}

        {mutation.isError && (
          <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>
            Error al guardar
          </span>
        )}
      </div>
    </>
  )
}
