import axios from 'axios'
import { inject, injectable } from 'inversify'
import * as moment from 'moment'
import { Moment } from 'moment'
import * as chalk from 'chalk'


@injectable()
export class TimeDoctor {
  private readonly axios = axios.create({
    baseURL: 'https://webapi.timedoctor.com/v1.1/',
  })

  constructor(
    @inject('config') private config
  ) {}

  private get company() {
    return this.config.timeDoctor.company_id
  }
  private get user() {
    return this.config.timeDoctor.user_id
  }

  getCompany() {
    return this.getRequest('/companies')
  }

  getWorkLogs(since: Moment, till: Moment) {
    return this.getRequest(`/companies/${this.company}/worklogs`, {
      consolidated: '1',
      end_date: till.format('Y-MM-DD'),
      start_date: since.format('Y-MM-DD'),
      user_ids: this.user,
    })
  }

  getTasks() {
    return this.getRequest(`/companies/${this.company}/users/${this.user}/tasks`, {
      company_id: this.company,
      user_id: this.user,
    })
  }

  getStats() {
    return Promise.all([
      this.getTimeLoggedPer('day'),
      this.getTimeLoggedPer('month'),
      this.getTimeLoggedPer('week'),
    ]).then(res => ({
      month: res[1],
      week: res[2],
      day: res[0],
    }))
  }

  formatStatsReport = (o: Record<string, number>): string => {
    return Object.entries(o)
      .map(([k, v]) =>
        `  last ${k}:`.padEnd(13, ' ') +
        chalk.yellow(v
          .toFixed(1)
          .padStart(6, ' ')) + ' hours'
      ).join('\n')
  }

  private getTimeLoggedPer(interval) {
    return this.getWorkLogs(moment().startOf(interval), moment())
      .then(res => +(res.total / 3600).toFixed(1))
  }

  private getRequest(path: string, params?: Record<string, string>) {
    return this.axios.get(path, {
      params: {
        ...params,
        _format: 'json',
        access_token: this.config.timeDoctor.token,
      }
    }).then(res => res.data)
  }
}
