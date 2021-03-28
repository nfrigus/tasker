import { inject, injectable } from 'inversify'
import { GoogleSheet } from '../google/GoogleSheet'
import { TaskTimerReport, WorkLog } from './TaskTimerReport'
import { sheets_v4 } from 'googleapis'
import { expect } from 'chai'
import Schema$Spreadsheet = sheets_v4.Schema$Spreadsheet
import Schema$GridRange = sheets_v4.Schema$GridRange


@injectable()
export class TaskTimer {
  private get spreadsheetId(): string {
    return this.config.tracking.sheets[new Date().getFullYear()]
  }

  private ranges = {
    logMonth0: {
      label: "logMonth0",
      range: "Days!I15:J16"
    },
    logMonth: {
      label: "logMonth",
      range: "Days!H15:I16"
    },
    DayOffTrack: {
      label: "DayOffTrack",
      range: "Days!A0:E15"
    },
    MonthTrack: {
      label: "MonthTrack",
      range: "Days!F0:M13"
    },
    WorkLog: {
      label: "WorkLog",
      range: "Log!A:F"
    },
    year: {
      label: "year",
      range: "Days!H14:I15"
    },
    MonthTarget: {
      label: "MonthTarget",
      range: "Log!H0:K5"
    },
    MonthProjectReport: {
      label: "MonthProjectReport",
      range: "Log!H6:K49"
    }
  }

  constructor(
    @inject('config') private config,
    private gapi: GoogleSheet,
  ) {}

  async getReport(): Promise<TaskTimerReport> {
    return new TaskTimerReport(await this.loadWorkLog())
  }

  public async loadAllData(): Promise<Schema$Spreadsheet> {
    return this.gapi.getBook(this.spreadsheetId)
      .then(res => res.data)
  }

  public async verifyBook() {
    const book = await this.loadAllData()

    const namedRanges = book.namedRanges.map(i => ({
      label: i.name,
      range: parseRange(book, i.range),
    }))

    expect(Object.values(this.ranges)).to.be.eql(namedRanges)
  }

  public async getSheetTabs(): Promise<string[]> {
    return this.gapi.getBook(this.spreadsheetId)
      .then(res => res.data.sheets
        .map(s => s.properties.title))
  }

  async loadWorkLog(): Promise<WorkLog[]> {
    return this.gapi.getRangeBatch(this.spreadsheetId, [this.ranges.WorkLog.label])
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

function parseRange(book: Schema$Spreadsheet, range: Schema$GridRange) {
  const sheet = book.sheets.find(sheet => sheet.properties.sheetId === range.sheetId)
  const sheetPrefix = sheet ? `${sheet.properties.title}!` : ''

  const A = getCellAddress(range.startColumnIndex, range.startRowIndex)
  const B = getCellAddress(range.endColumnIndex, range.endRowIndex)

  return `${sheetPrefix}${[A, B].join(':')}`
}

function getCellAddress(columnIdx: number, rowIdx: number) {
  return [
    String.fromCharCode(65 + columnIdx),
    rowIdx,
  ].filter(i => i !== undefined).join('')
}
