import { inject, injectable } from 'inversify'
import { GoogleSheet } from '../google/GoogleSheet'
import { TaskTimerReport } from './TaskTimerReport'


@injectable()
export class TaskTimer {
  private get spreadsheetId() {
    return this.config.tracking.sheets[new Date().getFullYear()]
  }

  private tabNames = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec',
  ]

  constructor(
    @inject('config') private config,
    private gapi: GoogleSheet,
  ) {}

  async getReport() {
    return new TaskTimerReport(await this.fetchLoggedData())
  }

  private async getSheetTabs() {
    return this.gapi.getSheets(this.spreadsheetId)
      .then(res => res.data.sheets.map(s => s.properties.title))
  }

  public getLoggedRanges() {
    return this.tabNames.slice(0, 1 + new Date().getMonth())
      .map(i => `${i}!A2:E`)
  }

  async fetchLoggedData() {
    const res = await this.gapi.getRangeBatch(this.spreadsheetId, this.getLoggedRanges())
    return res.data.valueRanges.reduce((a, v) => a.concat(v.values), []).map(TTRowToObject)
  }
}

function TTRowToObject(row) {
  return {
    date: row[0],
    project: row[1],
    scope: row[2],
    description: row[3],
    effort: row[4],
  }
}
