import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { organizationsService } from '@/services/organizations'
import { Building2, ChevronRight, Plus } from 'lucide-react'

export default function OrganizationsPage() {
  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsService.getAll,
  })

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Organizaciones</h1>
          <p>Administra las organizaciones y su configuración</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} />
          Nueva organización
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 68,
              background: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: '0.875rem',
        }}>
          Error al cargar organizaciones. Verifica que el backend esté activo.
        </div>
      )}

      {/* List */}
      {orgs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {orgs.map((org) => {
            const enabledFeatures = Object.values(org.features ?? {}).filter(Boolean).length
            const totalFeatures = Object.keys(org.features ?? {}).length
            const initials = org.name.slice(0, 2).toUpperCase()

            return (
              <Link
                key={org._id}
                to={`/organizations/${org._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'border-color .15s, box-shadow .15s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.boxShadow = 'var(--shadow)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: org.branding?.primaryColor
                      ? org.branding.primaryColor + '22'
                      : 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {org.branding?.logoUrl ? (
                      <img src={org.branding.logoUrl} style={{ width: 32, height: 32, objectFit: 'contain' }} alt="" />
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: org.branding?.primaryColor ?? 'var(--accent-text)',
                      }}>
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}>
                      {org.name}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      margin: '1px 0 0',
                    }}>
                      {org.slug ? `/${org.slug}` : 'Sin slug'} · {enabledFeatures}/{totalFeatures} módulos activos
                    </p>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {org.bundleIds?.ios && <span className="badge">iOS</span>}
                    {org.bundleIds?.android && <span className="badge">Android</span>}
                  </div>

                  <ChevronRight size={15} color="var(--text-muted)" />
                </div>
              </Link>
            )
          })}

          {orgs.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '64px 0',
              color: 'var(--text-muted)',
            }}>
              <Building2 size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
              <p style={{ fontSize: '0.875rem' }}>No hay organizaciones aún</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
