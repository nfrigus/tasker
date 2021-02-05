import axios from 'axios'
import { inject, injectable } from 'inversify'
import * as moment from 'moment'
import { Moment } from 'moment'


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

  getTimeLoggedPerMonth() {
    return this.getWorkLogs(moment().startOf('month'), moment())
      .then(res => +(res.total / 3600).toFixed(1))
  }

  getTimeLoggedPerWeek() {
    return this.getWorkLogs(moment().startOf('week'), moment())
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
