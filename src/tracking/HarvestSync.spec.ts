import "chai"
import { after, describe, it } from "mocha"
import { stub } from "sinon"
import * as moment from 'moment'
import { HarvestSync } from "./HarvestSync"

describe("HarvestSync", () => {
  it("getDaysBetween", () => {
    HarvestSync.getDaysBetween(moment("2018-01-01"), moment("2018-01-02"))
      .should.deep.equal(["2018-01-01", "2018-01-02"])
  })

  it("getSyncDays", () => {
    const now = stub(Date, "now").returns(new Date(2021, 2, 2).getTime())

    try {
      const result = HarvestSync.getSyncDays()
      result.should.be.deep.equal([
        "2021-02-01", "2021-02-02", "2021-02-03", "2021-02-04", "2021-02-05",
        "2021-02-06", "2021-02-07", "2021-02-08", "2021-02-09", "2021-02-10",
        "2021-02-11", "2021-02-12", "2021-02-13", "2021-02-14", "2021-02-15",
        "2021-02-16", "2021-02-17", "2021-02-18", "2021-02-19", "2021-02-20",
        "2021-02-21", "2021-02-22", "2021-02-23", "2021-02-24", "2021-02-25",
        "2021-02-26", "2021-02-27", "2021-02-28", "2021-03-01", "2021-03-02",
      ])
    } finally {
      now.restore()
    }
  })

  it("getSyncDays - ignore previous year", () => {
    const now = stub(Date, "now").returns(new Date(2022, 0, 3).getTime())

    try {
      const result = HarvestSync.getSyncDays()
      result.should.be.deep.equal(["2022-01-01", "2022-01-02", "2022-01-03"])
    } finally {
      now.restore()
    }
  })
})
