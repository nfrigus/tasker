import { inject, injectable } from 'inversify'

const fs = require('fs').promises

@injectable()
export class Storage {
  constructor(
    @inject('config') private config,
  ) {}

  async loadJson(key) {
    return fs
      .readFile(this.path(key))
      .then(JSON.parse)
  }

  async saveJson(key: string, data) {
    await fs.writeFile(this.path(key), JSON.stringify(data))
  }

  private path(file) {
    return `${this.config.secretsDir}/${file}.json`
  }
}