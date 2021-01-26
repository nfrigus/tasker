import axios from 'axios'
import { inject, injectable } from 'inversify'
import { HarvestReport } from './HarvestReport'
import * as moment from 'moment'


@injectable()
export class Harvest {
  private readonly axios = axios.create({
    baseURL: 'https://api.harvestapp.com',
  })
  constructor(
    @inject('config') private config,
  ) {
    Object.entries(this.config.harvest.credentials)
      .forEach(([key, value]) => {
        this.axios.defaults.headers.common[key] = value
      })
  }

  private get task() {
    return this.config.harvest.task
  }

  getMe() {
    return this.axios.get('/api/v2/users/me.json')
  }

  getTimeSheets() {
    return this.axios('/v2/time_entries').then(res => res.data)
  }

  postTimeEntry(data) {
    return this.axios.post('/v2/time_entries', { ...this.task, ...data })
  }

  patchTimeEntry(entryId, data) {
    return this.axios.patch(`/v2/time_entries/${entryId}`, { ...this.task, ...data })
  }

  async getReport() {
    const data = await this.getTimeSheets()

    return new HarvestReport(data)
  }

  getSyncDays() {
    const days = []
    const week = moment().subtract(1, 'w').startOf('isoWeek')

    for (let i = 0; i < 7 * 2; i++) {
      days.push(`${week.format('YYYY-MM-DD')}`)
      week.add(1, 'd')

      if (moment() < week) break
    }

    return days
  }
}
