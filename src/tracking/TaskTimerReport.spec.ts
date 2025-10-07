import "chai"
import * as moment from "moment"
import { describe, it } from "mocha"
import { TaskTimerReport, WorkLog } from "./TaskTimerReport"

describe("TaskTimerReport", () => {
  const entity = new TaskTimerReport([
    ['2020-01-01', 'Project A', 'Scope A', 1, '',],
    ['2020-01-01', 'Project B', 'Scope A', 2, 'Description B1'],
    ['2020-01-01', 'Project B', 'Scope B', 4, 'Description B2'],
  ].map(toWorkLog))

  it("getCombinedDayProjectLog", async () => {
    const report = entity.getCombinedDayProjectLog('2020-01-01', 'Project B')
    report.should.be.eqls({
      day: '2020-01-01',
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

function toWorkLog(data: any[]): WorkLog {
  return (<WorkLog>{
    date: data[0],
    description: data[4],
    effort: data[3],
    project: data[1],
    scope: data[2],
  })
}
