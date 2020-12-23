import "chai"
import { describe, it } from "mocha"
import { container } from "../di"
import { TaskTimer } from "./TaskTimer"

describe("TaskTimer", () => {
  const sheetId = "1S_EvpIkN62UQbW-iKEKPwZSdQLeYYFwf5yHXyfHexF4"
  const entity = container.get(TaskTimer)

  it("getLoggedRanges", async () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec',
    ].map(i => `${i}!A2:E`)
    const res = entity.getLoggedRanges()

    res.should.be.an('array')
    res.length.should.be.within(1, 12)
    res.forEach((month, i) => month.should.eql(months[i]))
  })

  it("fetchLoggedData", async () => {
    const res = await entity.fetchLoggedData()

    res.should.be.an('array')
    res.forEach(i => i.should.have.keys([
      'date',
      'description',
      'effort',
      'project',
      'scope',
    ]))
  })
})
