import { injectable } from 'inversify'
import { Storage } from '../core/Storage'

const readline = require('readline')
const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


@injectable()
export default class GoogleAuth {
  private auth
  private credentials: any
  private oauth: any

  constructor(
    private storage: Storage,
  ) {}

  public async getAuth() {
    return this.auth || (this.auth = this._getAuth())
  }

  private async _getAuth() {
    await this.loadCredentials()
    await this.authorize()

    return this.oauth
  }

  private async loadCredentials() {
    this.credentials = await this.storage.loadJson('google.credentials')

    return this.credentials
  }

  private createOauthClient() {
    const { client_secret, client_id, redirect_uris } = this.credentials.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    this.oauth = oAuth2Client
    return oAuth2Client
  }

  private async authorize() {
    this.createOauthClient()

    return this.storage
      .loadJson('google.token')
      .catch(() => this.requestRefreshToken())
      .then(token => this.oauth.setCredentials(token))
  }

  private requestRefreshToken() {
    const authUrl = this.oauth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    })
    console.log('Authorize this app by visiting this url:', authUrl)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close()
        resolve(code)
      })
    }).then(this.refreshToken)
  }

  private refreshToken = async (code) => {
    return new Promise((resolve, reject) => {
      this.oauth.getToken(code, (err, token) => {
        if (err) return reject('Error while trying to retrieve access token: ' + err)

        this.storage.saveJson('google.token', token)
          .then(() => resolve(token))
      })
    })
  }
}
