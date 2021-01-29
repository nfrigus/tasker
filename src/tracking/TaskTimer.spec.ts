import "chai"
import { describe, it } from "mocha"
import { container } from "../di"
import { TaskTimer } from "./TaskTimer"

describe("TaskTimer", () => {
  const entity = container.get(TaskTimer)

  it("getSheetTabs", async () => entity
    .getSheetTabs()
    .then(tabs => tabs
      .should.eql([
        'Glossary',
        'Days',
        'Log',
        'Legacy',
      ])))

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
    res.some(i => i.project === 'CC').should.be.ok
  })
})
