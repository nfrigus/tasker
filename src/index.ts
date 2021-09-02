import "reflect-metadata"
import { container } from './di'

console.time('Startup')
// @ts-ignore
container.get("app").run()
console.timeEnd('Startup')
