export class TaskTimerReport {
  private data: any

  constructor(data) {
    this.data = data
  }

  getCombinedDayProjectLog(date, project) {
    const tasks = this.data
      .filter(i => i.project === project && i.date === date)

    const effort = tasks.reduce((a, c) => a + +c.effort, 0)
    const description = tasks.map(i => trim(i.description, '"')).join('\n')

    return {
      description,
      effort,
    }
  }
}

function trim(str, chars) {
  if (!str) return str
  if (chars === "]") chars = "\\]";
  if (chars === "\\") chars = "\\\\";
  return str.replace(new RegExp(
    "^[" + chars + "]+|[" + chars + "]+$", "g",
  ), "");
}
