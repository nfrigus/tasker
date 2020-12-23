import "chai"
import { before, describe, it } from "mocha"
import { GoogleSheet } from "./GoogleSheet"
import { container } from '../di'

describe("GoogleSheet", () => {
  const sheetId = "1S_EvpIkN62UQbW-iKEKPwZSdQLeYYFwf5yHXyfHexF4"
  let entity: GoogleSheet

  before(() => {
    entity = container.get(GoogleSheet)
  })

  it("getSheets", async () => {
    const res = await entity.getSheets(sheetId)

    res.data.sheets.map(i => i.properties.title).should.eql([
        'Glossary',
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec',
      ]
    )
  })

  it("getRangeBatch", async () => {
    const res = await entity.getRangeBatch(sheetId, [
      'Jan!A2:E', 'Feb!A2:E', 'Mar!A2:E', 'Apr!A2:E',
      'May!A2:E', 'Jun!A2:E', 'Jul!A2:E', 'Aug!A2:E',
      'Sep!A2:E', 'Oct!A2:E', 'Nov!A2:E', 'Dec!A2:E',
    ])

    res.data.valueRanges.length.should.eql(12)
  })
})
