import "chai"
import { describe, it } from "mocha"
import { container } from '../di'
import { Harvest } from './Harvest'

describe("Harvest", () => {
  const entity = container.get(Harvest)

  it("getMe", async () => {
    const res = await entity.getMe()


  })
})
