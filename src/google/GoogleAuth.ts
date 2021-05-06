import { inject, injectable } from 'inversify'

const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


@injectable()
export default class GoogleAuth {
  private auth
  private credentials: any
  private oauth: any

  constructor(
    @inject('config') private config,
  ) {}

  // todo: Refactor to use Storage
  private getTokenPath() {
    return this.config.secretsDir + '/google.token.json'
  }

  public async getAuth() {
    return this.auth || (this.auth = this._getAuth())
  }

  private async _getAuth() {
    await this.loadCredentials()
    await this.authorize()

    return this.oauth
  }

  private async loadCredentials() {
    this.credentials = await fs.promises
      .readFile(this.config.secretsDir + '/google.credentials.json')
      .then(JSON.parse)

    return this.credentials
  }

  private createOauthClient() {
    const { client_secret, client_id, redirect_uris } = this.credentials.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    this.oauth = oAuth2Client
    return oAuth2Client
  }

  private authorize() {
    this.createOauthClient()

    return fs.promises.readFile(this.getTokenPath()).then(
      token => this.oauth.setCredentials(JSON.parse(token)),
      () => this.requestRefreshToken()
        .then(token => this.oauth.setCredentials(token)))
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

        fs.promises.writeFile(this.getTokenPath(), JSON.stringify(token))
          .then(() => resolve(token))
      })
    })
  }
}
