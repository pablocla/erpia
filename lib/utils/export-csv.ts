export function arrayToCsv(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return ""
  
  // Extract headers
  const headers = Object.keys(data[0])
  
  // Build CSV
  const csvRows = []
  
  // Add headers row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      if (val === null || val === undefined) return '""'
      const str = String(val)
      return `"${str.replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(","))
  }
  
  // Use UTF-8 BOM so Excel opens it properly
  return "\uFEFF" + csvRows.join("\n")
}
