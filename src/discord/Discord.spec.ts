import "chai"
import { after, before, describe, it } from "mocha"
import Discord from './Discord'
import { container } from "../di"

describe("Discord", () => {
  let entity

  before(async () => {
    entity = container.get(Discord)
    await entity.login()
  })
  after(async () => {
    await entity.logout()
  })

  it('getMembersJoinedLast365Days', async () => {
    const records = await entity.getMembersJoinedLast365Days()

    records.size.should.be.above(50)
    records.each(msg => {
      msg.type.should.equal('GUILD_MEMBER_JOIN')
    })
  })
})
