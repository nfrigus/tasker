import "chai"
import { describe, it } from "mocha"
import { TaskTimerReport } from "./TaskTimerReport"
import * as moment from "moment"

describe("TaskTimerReport", () => {
  const entity = new TaskTimerReport([{
    date: '2020-01-01',
    description: '',
    effort: 1,
    project: 'Project A',
    scope: 'Scope A',
  }, {
    date: '2020-01-01',
    description: 'Description B1',
    effort: 2,
    project: 'Project B',
    scope: 'Scope A',
  }, {
    date: '2020-01-01',
    description: 'Description B2',
    effort: 4,
    project: 'Project B',
    scope: 'Scope B',
  }])

  it("getCombinedDayProjectLog", async () => {
    const report = entity.getCombinedDayProjectLog('2020-01-01', 'Project B')
    report.should.be.eqls({
      description: 'Description B1\nDescription B2',
      effort: 6,
    })
  })

  it("getYearDailyEffortReport", async () => {
    const daysSinceYearBegin = moment().diff(moment().startOf('year'), 'days') + 1

    const report = entity.getYearDailyEffortReport()
    report.should.be.an('array').with.length(daysSinceYearBegin)

    report.slice(-1)[0].day.should.equal(moment().format('YYYY-MM-DD'))
  })
})
