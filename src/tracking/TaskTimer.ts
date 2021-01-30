import { inject, injectable } from 'inversify'
import { GoogleSheet } from '../google/GoogleSheet'
import { TaskTimerReport, WorkLog } from './TaskTimerReport'


@injectable()
export class TaskTimer {
  private get spreadsheetId(): string {
    return this.config.tracking.sheets[new Date().getFullYear()]
  }

  private ranges = {
    WorkLog: 'WorkLog'
  }

  constructor(
    @inject('config') private config,
    private gapi: GoogleSheet,
  ) {}

  async getReport(): Promise<TaskTimerReport> {
    return new TaskTimerReport(await this.fetchLoggedData())
  }

  public async getSheetTabs(): Promise<string[]> {
    return this.gapi.getSheets(this.spreadsheetId)
      .then(res => res.data.sheets
        .map(s => s.properties.title))
  }

  async fetchLoggedData(): Promise<WorkLog[]> {
    return this.gapi.getRangeBatch(this.spreadsheetId, [this.ranges.WorkLog])
      .then(res => res.data.valueRanges
        .reduce((a, v) => a.concat(v.values), [])
        .map(TTRowToObject))
  }
}

function TTRowToObject(row: any[]): WorkLog {
  return {
    date: row[0],
    project: row[1],
    scope: row[2],
    description: row[3],
    effort: +row[4],
  }
}
