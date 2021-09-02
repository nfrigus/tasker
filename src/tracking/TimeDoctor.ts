import axios from 'axios'
import { inject, injectable } from 'inversify'
import * as moment from 'moment'
import { Moment } from 'moment'
import * as chalk from 'chalk'
import { Storage } from '../core/Storage'
import { createServer } from 'http'


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
    return this.axios.get(path, {
      params: {
        ...params,
        _format: 'json',
        access_token: await this.authenticate(),
      }
    }).then(res => res.data)
  }

  /**
   * ```sh
   * CLIENT_ID="2649_2qf0mzs2plmo4ocwsw4wcooc4swg0wggwc4gs4og0o0scko4w0"
   * REDIRECT_URI="https%3A%2F%2Fadmin.timedoctor.com%2Fv2%2Fcontent%2Fget_api_key.php"
   * CLIENT_SECRET="..."
   *
   * curl "https://webapi.timedoctor.com/oauth/v2/auth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code"
   * AUTHORIZATION_CODE="..."
   * curl "https://webapi.timedoctor.com/oauth/v2/token?client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&grant_type=authorization_code&redirect_uri=$REDIRECT_URI&code=$AUTHORIZATION_CODE"
   * REFRESH_TOKEN="..."
   * curl "https://webapi.timedoctor.com/oauth/v2/token?client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&grant_type=refresh_token&refresh_token=$REFRESH_TOKEN"
   * ```
   */
  public authWizard = () => {
    const redirect_uri = encodeURIComponent('http://127.0.0.1:12345')

    const server = createServer((request, response) => {
      request.on('error', console.error)

      const code = request.url.replace('/?state=&code=', '')
      const url = `https://webapi.timedoctor.com/oauth/v2/token?client_id=${this.client_id}&client_secret=${this.secret_key}&grant_type=authorization_code&redirect_uri=${redirect_uri}&code=${code}`

      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.write('<script>window.close()</script>')
      response.end()
      server.close()

      axios.get(url)
        .then(res => this.storage.saveJson('timedoctor', res.data))
        .catch(e => console.error(e.response.data))
    })
    server.listen(12345)

    return `https://webapi.timedoctor.com/oauth/v2/auth?client_id=${this.client_id}&redirect_uri=${redirect_uri}&response_type=code`
  }

  private async authenticate() {
    if (!this.auth) {
      this.auth = await this.storage.loadJson('timedoctor')
    }

    if (!this.auth || typeof this.auth.expires_at !== 'number' && this.auth.expires_at <= Date.now()) {
      this.auth = await this.refreshAuth(this.auth.refresh_token)
      this.auth.expires_at = Date.now() + this.auth.expires_in * 1000
      await this.storage.saveJson('timedoctor', this.auth)
    }

    return this.auth.access_token
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
