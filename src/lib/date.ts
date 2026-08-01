// `new Date('2026-08-08')` parses as UTC midnight; toLocaleDateString() then
// renders it in the browser's local timezone, which rolls back a day for any
// timezone behind UTC (all of the US). Date-only strings (YYYY-MM-DD) need
// their components read directly and built as a local date instead.
export function formatDate(dateString: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(dateString)
  if (dateOnly) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString()
  }
  return new Date(dateString).toLocaleDateString()
}
