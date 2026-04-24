import * as XLSX from 'xlsx'

export interface PreRegistrationRow {
  email: string
  name?: string
  channel?: string
  position?: string
  country?: string
  observations?: string
}

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getCellValue(row: Record<string, any>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader)

  for (const [key, val] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeader(key))) {
      const stringVal = String(val ?? '').trim()
      if (stringVal) return stringVal
    }
  }

  return undefined
}

export const excelHelpers = {
  // Descargar template de Excel
  downloadTemplate: (eventName?: string) => {
    const headers = [
      'EMAIL',
      'NOMBRE',
      'CANAL / ORGANIZACIÓN',
      'CARGO',
      'PAIS',
      'OBSERVACIONES',
    ]

    const templateData = [
      headers,
      [
        'correo@ejemplo.com',
        'Nombre Completo',
        'Canal/Organización',
        'Cargo',
        'País',
        'Observaciones',
      ],
      ['otro@ejemplo.com', '', '', '', '', ''],
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData as any)
    
    // Ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, // email
      { wch: 20 }, // name
      { wch: 20 }, // channel
      { wch: 15 }, // position
      { wch: 15 }, // country
      { wch: 30 }, // observations
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pre-registro')

    const fileName = `plantilla-pre-registro${eventName ? `-${eventName}` : ''}.xlsx`
    XLSX.writeFile(wb, fileName)
  },

  // Parsear archivo Excel
  parseExcelFile: (file: File): Promise<PreRegistrationRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(sheet, { defval: '' })

          // Validar y limpiar datos
          const cleanedRows = rows
            .map((row) => {
              const email = getCellValue(row, ['email', 'correo'])
              const name = getCellValue(row, ['name', 'nombre'])
              const channel = getCellValue(row, [
                'channel',
                'canal',
                'canal / organizacion',
                'canal/organizacion',
                'organizacion',
              ])
              const position = getCellValue(row, ['position', 'cargo'])
              const country = getCellValue(row, ['country', 'pais'])
              const observations = getCellValue(row, ['observations', 'observaciones'])

              return { email, name, channel, position, country, observations }
            })
            .filter((row) => row.email && row.email.trim()) // Solo filas con email
            .map((row) => ({
              email: String(row.email || '').trim().toLowerCase(),
              name: row.name ? String(row.name).trim() : undefined,
              channel: row.channel ? String(row.channel).trim() : undefined,
              position: row.position ? String(row.position).trim() : undefined,
              country: row.country ? String(row.country).trim() : undefined,
              observations: row.observations ? String(row.observations).trim() : undefined,
            }))

          resolve(cleanedRows)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsBinaryString(file)
    })
  },
}
