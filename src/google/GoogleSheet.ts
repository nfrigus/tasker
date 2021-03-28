import { injectable } from 'inversify'
import GoogleAuth from './GoogleAuth'
import { sheets_v4 } from 'googleapis'
import { GaxiosResponse } from 'gaxios'
import Schema$Spreadsheet = sheets_v4.Schema$Spreadsheet

@injectable()
export class GoogleSheet {
  private client: Promise<sheets_v4.Sheets>

  constructor(
    private auth: GoogleAuth,
  ) {}

  async getRange(req) {
    const client = await this.getClient()

    return client.spreadsheets.values.get(req)
  }

  async getBook(spreadsheetId): Promise<GaxiosResponse<Schema$Spreadsheet>> {
    const client = await this.getClient()

    return client.spreadsheets.get({ spreadsheetId })
  }

  async getRangeBatch(spreadsheetId: string, ranges: string[]) {
    const client = await this.getClient()

    return client.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    })
  }

  private async getClient() {
    if (!this.client) {
      this.client = new Promise(async resolve => {
        resolve(new sheets_v4.Sheets({ auth: await this.auth.getAuth() }))
      })
    }

    return this.client
  }
}
