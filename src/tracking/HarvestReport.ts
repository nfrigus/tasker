export class HarvestReport {
  private data: any

  constructor(data) {
    this.data = data
  }

  getReportByDate(date) {
    const reports = this.data.time_entries.filter(i => i.spent_date === date)

    if (reports.length > 1) throw new Error(`Too many reports (${reports.length}) on ${date}`)
    if (!reports.length) return { hours: 0 }

    const report = { ...reports[0] }
    report.notes = trim(report.notes, '"')

    return report
  }
}

function trim(str, chars) {
  if (!str) return str
  if (chars === "]") chars = "\\]";
  if (chars === "\\") chars = "\\\\";
  return str.replace(new RegExp(
    "^[" + chars + "]+|[" + chars + "]+$", "g",
  ), "");
}
