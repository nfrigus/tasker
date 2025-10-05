import "chai"
import { describe, it } from "mocha"
import MarketModule from "./MarketModule"
import { writeFileSync } from "fs"

const entity = new MarketModule()

describe("Djinni", () => {
  it("getJobFilters", async () => {
    const data = await entity.getJobFilters()
    console.table(data)

    writeFileSync("salaries.json", JSON.stringify(data, null, 2))
  })
})
