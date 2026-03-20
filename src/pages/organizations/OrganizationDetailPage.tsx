import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsService } from '@/services/organizations'
import type { OrganizationFeatures } from '@/types/organization'
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const FEATURE_LABELS: Record<keyof OrganizationFeatures, string> = {
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
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3>Módulos activos</h3>
            <p style={{ fontSize: '0.8125rem', marginTop: 2 }}>
              Los cambios se reflejan inmediatamente en la app móvil.
            </p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {(Object.keys(features) as (keyof OrganizationFeatures)[]).map((key, i, arr) => (
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
                    checked={features[key]}
                    onChange={() => setFeatures((f) => f ? { ...f, [key]: !f[key] } : f)}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
            ))}
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
          <h3>Colores</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="Color primario">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding((b) => b ? { ...b, primaryColor: e.target.value } : b)}
                  style={{ width: 36, height: 36, padding: 3, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding((b) => b ? { ...b, primaryColor: e.target.value } : b)}
                  style={{ fontFamily: 'monospace', flex: 1 }}
                />
              </div>
            </Field>
            <Field label="Color secundario">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding((b) => b ? { ...b, secondaryColor: e.target.value } : b)}
                  style={{ width: 36, height: 36, padding: 3, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding((b) => b ? { ...b, secondaryColor: e.target.value } : b)}
                  style={{ fontFamily: 'monospace', flex: 1 }}
                />
              </div>
            </Field>
          </div>
          <Field label="Color barra de tabs (app)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={branding.tabBarColor ?? '#ffffff'}
                onChange={(e) => setBranding((b) => b ? { ...b, tabBarColor: e.target.value } : b)}
                style={{ width: 36, height: 36, padding: 3, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
              />
              <input
                value={branding.tabBarColor ?? '#ffffff'}
                onChange={(e) => setBranding((b) => b ? { ...b, tabBarColor: e.target.value } : b)}
                style={{ fontFamily: 'monospace', flex: 1 }}
                placeholder="#ffffff"
              />
            </div>
          </Field>
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
