import { inject, injectable } from 'inversify'
import { GoogleSheet } from '../google/GoogleSheet'
import { TaskTimerReport } from './TaskTimerReport'


@injectable()
export class TaskTimer {
  private get spreadsheetId() {
    return this.config.tracking.sheets[new Date().getFullYear()]
  }

  private ranges = {
    WorkLog: 'WorkLog'
  }

  constructor(
    @inject('config') private config,
    private gapi: GoogleSheet,
  ) {}

  async getReport() {
    return new TaskTimerReport(await this.fetchLoggedData())
  }

  public async getSheetTabs() {
    return this.gapi.getSheets(this.spreadsheetId)
      .then(res => res.data.sheets.map(s => s.properties.title))
  }

  async fetchLoggedData() {
    const res = await this.gapi.getRangeBatch(this.spreadsheetId, [this.ranges.WorkLog])
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
