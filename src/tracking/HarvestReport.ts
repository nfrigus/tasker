import { trim } from '../common'

export class HarvestReport {
  private data: any

  constructor(data) {
    this.data = data
  }

  getReportByDate(date): TimeEntry {
    const reports: TimeEntry[] = this.data.time_entries.filter(i => i.spent_date === date)

    if (reports.length > 1) throw new Error(`Too many reports (${reports.length}) on ${date}`)
    if (!reports.length) return

    const report = { ...reports[0] }
    report.notes = trim(report.notes, '"')

    return report
  }
}

export interface TimeEntry {
  id: number
  spent_date: string // "YYYY-MM-DD"
  hours: number
  hours_without_timer: number
  rounded_hours: number
  notes: string
  is_locked: boolean
  locked_reason: null,
  is_closed: boolean
  is_billed: boolean
  timer_started_at: null,
  started_time: null,
  ended_time: null,
  is_running: boolean
  billable: boolean
  budgeted: boolean
  billable_rate: null,
  cost_rate: null,
  created_at: string // '2021-11-05T16:01:06Z'
  updated_at: string // '2021-11-05T16:01:06Z'
  user: { id: number, name: string }
  client: { id: number, name: string, currency: string }
  project: { id: number, name: string, code: string }
  task: { id: number, name: string }
  user_assignment: {
    id: number
    is_project_manager: boolean
    is_active: boolean
    use_default_rates: boolean
    budget: null
    created_at: string // '2020-04-28T09:48:01Z'
    updated_at: string // '2020-04-28T09:48:01Z'
    hourly_rate: null
  }
  task_assignment: {
    id: number
    billable: boolean
    is_active: boolean
    created_at: string // '2020-03-25T16:09:11Z'
    updated_at: string // '2020-04-27T16:47:10Z'
    hourly_rate: null
    budget: null
  }
  invoice: null
  external_reference: null
}
