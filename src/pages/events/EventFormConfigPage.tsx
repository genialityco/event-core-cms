import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import { ChevronLeft, Save, CheckCircle2, GripVertical } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { TravelerFormConfig, SectionConfig, FieldConfig } from '@/types/event'

const SECTION_LABELS: Record<string, string> = {
  outbound_flight: 'Vuelo de ida',
  return_flight:   'Vuelo de regreso',
  dietary:         'Restricciones alimentarias',
  professional:    'Identificación profesional',
}

export default function EventFormConfigPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<TravelerFormConfig | null>(null)
  const [saved, setSaved] = useState(false)

  const { data: org } = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => organizationsService.getById(orgId!),
    enabled: !!orgId,
  })

  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => eventsService.getById(eventId!),
    enabled: !!eventId,
  })

  const { data: formConfig, isLoading } = useQuery({
    queryKey: ['form-config', eventId],
    queryFn: () => eventsService.getFormConfig(eventId!),
    enabled: !!eventId,
  })

  useEffect(() => {
    if (formConfig) setConfig(formConfig)
  }, [formConfig])

  const mutation = useMutation({
    mutationFn: (body: Partial<TravelerFormConfig>) =>
      eventsService.saveFormConfig(eventId!, body),
    onSuccess: (data) => {
      queryClient.setQueryData(['form-config', eventId], data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const toggleSection = (sectionKey: string) => {
    setConfig((c) => c ? {
      ...c,
      sections: c.sections.map((s) =>
        s.key === sectionKey ? { ...s, enabled: !s.enabled } : s
      ),
    } : c)
  }

  const toggleField = (sectionKey: string, fieldKey: string) => {
    setConfig((c) => c ? {
      ...c,
      sections: c.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, fields: s.fields.map((f) => f.key === fieldKey ? { ...f, enabled: !f.enabled } : f) }
          : s
      ),
    } : c)
  }

  const toggleFieldRequired = (sectionKey: string, fieldKey: string) => {
    setConfig((c) => c ? {
      ...c,
      sections: c.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, fields: s.fields.map((f) => f.key === fieldKey ? { ...f, required: !f.required } : f) }
          : s
      ),
    } : c)
  }

  const updateFieldLabel = (sectionKey: string, fieldKey: string, label: string) => {
    setConfig((c) => c ? {
      ...c,
      sections: c.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, fields: s.fields.map((f) => f.key === fieldKey ? { ...f, label } : f) }
          : s
      ),
    } : c)
  }

  const updateSectionLabel = (sectionKey: string, label: string) => {
    setConfig((c) => c ? {
      ...c,
      sections: c.sections.map((s) =>
        s.key === sectionKey ? { ...s, label } : s
      ),
    } : c)
  }

  if (isLoading || !config) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 32, width: 240, background: '#f1f5f9', borderRadius: 8 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 160, background: '#f1f5f9', borderRadius: 14 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          to={`/organizations/${orgId}/events`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 style={{ marginBottom: 1 }}>Formulario viajero</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--success)', fontWeight: 500 }}>
              <CheckCircle2 size={15} />
              Guardado
            </span>
          )}
          {mutation.isError && (
            <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>Error al guardar</span>
          )}
          <button
            className="btn btn-primary"
            onClick={() => mutation.mutate(config)}
            disabled={mutation.isPending}
          >
            <Save size={14} />
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* WhatsApp URL */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>WhatsApp</h3>
        <label className="field-label">Enlace del grupo de WhatsApp</label>
        <input
          value={config.whatsappGroupUrl ?? ''}
          onChange={(e) => setConfig((c) => c ? { ...c, whatsappGroupUrl: e.target.value } : c)}
          placeholder="https://chat.whatsapp.com/..."
          style={{ maxWidth: 480 }}
        />
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
          Si está vacío, la sección de WhatsApp no se muestra en la app.
        </p>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {config.sections.map((section: SectionConfig) => (
          <div
            key={section.key}
            className="card"
            style={{ opacity: section.enabled ? 1 : 0.5, transition: 'opacity .2s' }}
          >
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px',
              borderBottom: section.enabled ? '1px solid var(--border)' : 'none',
            }}>
              <GripVertical size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <input
                  value={section.label}
                  onChange={(e) => updateSectionLabel(section.key, e.target.value)}
                  disabled={!section.enabled}
                  style={{
                    fontSize: '0.9375rem', fontWeight: 600,
                    border: 'none', outline: 'none',
                    background: 'transparent',
                    width: '100%', maxWidth: 320,
                    color: 'var(--text-primary)',
                    padding: 0,
                  }}
                  placeholder={SECTION_LABELS[section.key] ?? section.key}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {SECTION_LABELS[section.key]}
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => toggleSection(section.key)}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </div>

            {/* Fields */}
            {section.enabled && (
              <div style={{ padding: '8px 0' }}>
                {/* Header row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px',
                  gap: 8,
                  padding: '4px 20px 8px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CAMPO</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>REQUERIDO</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>ACTIVO</span>
                </div>
                {section.fields.map((field: FieldConfig, fi: number) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '8px 20px',
                      borderBottom: fi < section.fields.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: field.enabled ? 1 : 0.45,
                    }}
                  >
                    <div>
                      <input
                        value={field.label}
                        onChange={(e) => updateFieldLabel(section.key, field.key, e.target.value)}
                        disabled={!field.enabled}
                        style={{
                          fontSize: '0.875rem',
                          border: '1px solid transparent',
                          borderRadius: 6,
                          padding: '4px 8px',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          transition: 'border-color .15s',
                          width: '100%',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                      />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontFamily: 'monospace', paddingLeft: 8 }}>
                        {field.key}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={field.required}
                          disabled={!field.enabled}
                          onChange={() => toggleFieldRequired(section.key, field.key)}
                        />
                        <span className="toggle-track" />
                        <span className="toggle-thumb" />
                      </label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => toggleField(section.key, field.key)}
                        />
                        <span className="toggle-track" />
                        <span className="toggle-thumb" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
