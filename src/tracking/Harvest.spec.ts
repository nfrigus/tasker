import "chai"
import { describe, it } from "mocha"
import { container } from '../di'
import { Harvest } from './Harvest'

describe("Harvest", () => {
  const entity = container.get(Harvest)

  it("getMe", async () => {
    const res = await entity.getMe()

    res.should.have.property("data").which.is.deep.equal({
      id: 3203145,
      first_name: 'Semen',
      last_name: 'Shestakov',
      email: 'semen@code-care.pro',
      telephone: '',
      timezone: 'Kyiv',
      weekly_capacity: 72000,
      has_access_to_all_future_projects: true,
      is_contractor: true,
      is_admin: false,
      is_project_manager: false,
      can_see_rates: false,
      can_create_projects: false,
      can_create_invoices: false,
      is_active: true,
      calendar_integration_enabled: false,
      calendar_integration_source: null,
      created_at: '2020-03-30T10:10:07Z',
      updated_at: '2021-10-15T14:43:42Z',
      roles: [],
      avatar_url: 'https://proxy.harvestfiles.com/production_harvestapp_public/uploads/users/avatar/003/203/145/410fecbeaf74e226a7ff35af623b0b5e90b57941/normal.png?1585583667'
    })
  })

  it("getTimeSheets", async () => {

    const res = await entity.getTimeSheets()
    res.should.have.all.keys(
      'links',
      'next_page',
      'page',
      'per_page',
      'previous_page',
      'time_entries',
      'total_entries',
      'total_pages',
    )

    res.time_entries.forEach(timeEntry => {
      timeEntry.should.have.all.keys(
        "id",
        "spent_date",
        "hours",
        "hours_without_timer",
        "rounded_hours",
        "notes",
        "is_locked",
        "locked_reason",
        "is_closed",
        "is_billed",
        "timer_started_at",
        "started_time",
        "ended_time",
        "is_running",
        "billable",
        "budgeted",
        "billable_rate",
        "cost_rate",
        "created_at",
        "updated_at",
        "user",
        "client",
        "project",
        "task",
        "user_assignment",
        "task_assignment",
        "invoice",
        "external_reference",
      )
    })
  })
})
