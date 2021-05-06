import axios from 'axios'
import { inject, injectable } from 'inversify'
import * as moment from 'moment'
import { Moment } from 'moment'
import * as chalk from 'chalk'
import { Storage } from '../core/Storage'


/**
 * https://webapi.timedoctor.com/doc#authentication
 */
@injectable()
export class TimeDoctor {
  private readonly axios = axios.create({
    baseURL: 'https://webapi.timedoctor.com/',
  })

  private auth: any

  constructor(
    @inject('config') private config,
    private storage: Storage,
  ) {}

  private get company() {
    return this.config.timeDoctor.company_id
  }
  private get user() {
    return this.config.timeDoctor.user_id
  }
  private get client_id() {
    return this.config.timeDoctor.client_id
  }
  private get secret_key() {
    return this.config.timeDoctor.secret_key
  }

  getCompany() {
    return this.getRequest('/v1.1/companies')
  }

  getWorkLogs(since: Moment, till: Moment) {
    return this.getRequest(`/v1.1/companies/${this.company}/worklogs`, {
      consolidated: '1',
      end_date: till.format('Y-MM-DD'),
      start_date: since.format('Y-MM-DD'),
      user_ids: this.user,
    })
  }

  getTasks() {
    return this.getRequest(`/v1.1/companies/${this.company}/users/${this.user}/tasks`, {
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

  private async getRequest(path: string, params?: Record<string, string>) {
    if (!this.isAuthenticated()) {
      await this.authenticate()
    }

    return this.axios.get(path, {
      params: {
        ...params,
        _format: 'json',
        access_token: this.auth.access_token,
      }
    }).then(res => res.data)
  }

  private isAuthenticated(): boolean {
    return this.auth && typeof this.auth.expires_at === 'number' && this.auth.expires_at > Date.now()
  }

  private async authenticate() {
    this.auth = await this.storage.loadJson('timedoctor')

    if (!this.isAuthenticated()) {
      this.auth = await this.refreshAuth(this.auth.refresh_token)
      this.auth.expires_at = Date.now() + this.auth.expires_in * 1000
      this.storage.saveJson('timedoctor', this.auth)
    }
  }

  private async refreshAuth(refresh_token) {
    return this.axios.get('/oauth/v2/token', {
      params: {
        client_id: this.client_id,
        client_secret: this.secret_key,
        grant_type: `refresh_token`,
        refresh_token,
      }
    }).then(res => res.data)
  }
}
