import * as config from 'config'
import App from './App'
// @ts-ignore
import { Client } from "discord.js-selfbot"
import { Container } from "inversify"

export const container = new Container({
  autoBindInjectable: true,
  defaultScope: "Singleton",
})

container.bind("app").to(App)
container.bind("process").toConstantValue(process)
container.bind("config").toConstantValue(config)
container.bind(App).to(App)
container.bind(Client).toFactory(() => new Client)
