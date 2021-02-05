import "chai"
import { describe, it } from "mocha"
import { container } from '../di'
import { TimeDoctor } from './TimeDoctor'
import * as moment from 'moment'

describe("TimeDoctor", () => {
  const entity = container.get(TimeDoctor)

  it("getCompany", async () => {
    const res = await entity.getCompany()

    res.should.have.keys(['user', 'accounts'])
  })

  it("getWorkLogs", async () => {
    const res = await entity.getWorkLogs(moment(), moment())

    res.should.have.keys([
      'end_time',
      'start_time',
      'total',
      'url',
      'worklogs',
    ])
    res.worklogs.should.have.keys([
      'count',
      'items',
      'limit',
      'offset',
      'url',
    ])
    res.worklogs.items.forEach(item => item.should.have.keys([
      'id',
      'length',
      'project_id',
      'project_name',
      'task_id',
      'task_name',
      'task_url',
      'user_id',
      'user_name',
    ]))
  })

  it("getTasks", async () => {
    const res = await entity.getTasks()

    res.should.have.keys([
      'count',
      'limit',
      'offset',
      'tasks',
      'url',
    ])
    res.tasks.forEach(task => task.should.have.keys([
      'active',
      'assigned_by',
      'id',
      'project_id',
      'project_name',
      'status',
      'task_id',
      'task_link',
      'task_name',
      'url',
      'user_id',
    ]))
  })

  it("getTimeLoggedPerMonth", async () => {
    const res = await entity.getTimeLoggedPerMonth()

    res.should.be.a('number')
  })

  it("getTimeLoggedPerWeek()", async () => {
    const res = await entity.getTimeLoggedPerWeek()

    res.should.be.a('number')
  })
})
