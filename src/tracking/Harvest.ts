import axios from 'axios'
import { inject, injectable } from 'inversify'
import { HarvestReport } from './HarvestReport'


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
}
