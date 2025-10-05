import { injectable } from 'inversify'
import axios from 'axios'
import { load } from 'cheerio'
import { writeFile } from 'fs/promises'


@injectable()
export default class {
  constructor() {

  }

  async loadDjinniStats() {

  }

  async getJobFilters() {
    const jobFiltersSelector = '.jobs-filter .jobs-filter__set:eq(0) a.jobs-filter__link'
    const jobs = await axios.get('https://djinni.co/salaries/')
    const $ = load(jobs.data);

    const results = await Promise.all($(jobFiltersSelector).map(this.parseFilterLink).toArray())

    this.saveAsCsv(results)

    return results
  }

  private parseFilterLink = async (i, node) => {
    const url = `https://djinni.co${node.attribs.href}remote/?exp=5&period=last30`
    return ({
      category: load(node).text().trim(),
      ...await this.getSalaryStats(url),
      url,
    })
  }

  private async getSalaryStats(url: string) {
    const page = await axios.get(url)
    const $ = load(page.data)

    const vacancies = $('.summary-stastistics--item_vacancies .summary-item--value')
      .map((i, node) => load(node).text().trim()).toArray()

    const candidates = $('.summary-stastistics--item_candidates .summary-item--value')
      .map((i, node) => load(node).text().trim()).toArray()

    return {
      bid: vacancies[1],
      ask: candidates[1],
      demand: vacancies[0],
      supply: candidates[0],
      requests: candidates[2],
      replies: vacancies[2],
    }
  }

  private saveAsCsv(data) {
    const content = [
      Object.keys(data[0]),
      ...data.map(i => Object.values(i))
    ].map(row => row.map(col => `"${col}"`).join(',')).join('\n')

    writeFile("salaries.csv", content).catch(console.error)
  }
}
