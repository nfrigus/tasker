import "chai"
import { describe, it, after } from "mocha"
import { stub } from "sinon"
import * as moment from 'moment'
import { container } from '../di'
import { HarvestSync } from "./HarvestSync"

describe("HarvestSync", () => {
  const entity = container.get(HarvestSync)

  it("getSyncDays", async () => {
    const now = stub(Date, "now").returns(new Date(2021, 2, 2).getTime())

    try {
      const result = entity.getSyncDays()
      result.should.be.deep.equal([
        '2021-02-22', '2021-02-23', '2021-02-24', '2021-02-25',
        '2021-02-26', '2021-02-27', '2021-02-28', '2021-03-01',
        '2021-03-02',
      ])
    } finally {
      now.restore()
    }
  })
})
