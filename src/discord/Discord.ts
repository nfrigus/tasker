// @ts-ignore
import { Client } from "discord.js-selfbot"
import { Collection, Message } from "discord.js"
import { filter, finalize, tap } from "rxjs/operators"
import { fromEvent } from "rxjs"
import { inject, injectable } from "inversify"
import { promises as fs } from "fs"
import moment = require('moment')


export enum DiscordMessageFilter {
  'all' = 'all',
  'direct' = 'direct',
  'guild' = 'guild',
  'none' = 'none',
}

type MessageCollection = Collection<string, Message>
@injectable()
export default class Discord {
  private filteredMessages$
  private guilds: Set<string>
  private messages$
  private logMessages = false

  constructor(
    @inject('config') private config,
    private client: Client,
  ) {
    this.guilds = new Set(Object.values(this.config.discord.guilds))

    this.messages$ = fromEvent(this.client, 'message')

    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user.tag}!`)
    })

    this.messages$.pipe(
      filter((msg: any) => msg.content === 'ping'),
      tap((msg: any) => msg.reply('pong')),
      finalize(() => console.log('Discord::message unsubscribe')),
    ).subscribe()

    this.setMsgFilter(DiscordMessageFilter.guild)
  }

  public async login() {
    await this.client.login(this.config.discord.token)
  }

  public logout() {
    this.client.destroy()
  }

  /**
   * Post WFH "+" message once a day only
   */
  public async postWFH() {
    const channel = this.client.channels.cache.get(this.config.discord.channels.wfh)
    const before = new Date(Date.now() - 86400e3)
    const collection = await this.getChannelMessagesBefore(channel.id, before)

    const today = moment().startOf('day').valueOf()
    const userId = this.client.user.id
    const isPostedToday = collection.filter(msg =>
      msg.author.id === userId &&
      msg.content === "+" &&
      msg.createdTimestamp > today
    ).size

    if (!isPostedToday) {
      channel.send('+')
    }

    return !isPostedToday
  }

  public async postPM() {
    const channel = await this.client.users.fetch("716632310895738912")
    const collection = await channel.messages.fetch()

    collection.filter(msg => console.log([
      'MSG',
      msg.content,
    ].join(' ')))

    channel.send('+')
  }

  public getMessages() {
    if (!this.filteredMessages$) {
      this.filteredMessages$ = this.messages$.pipe(
        tap(msg => this.logMessage(msg)),
        filter(msg => this.filterMessage(msg)),
      )
    }

    return this.filteredMessages$
  }

  private async getChannelMessagesBefore(channel, date) {
    const { messages } = this.client.channels.cache.get(channel)
    let collection: MessageCollection = await messages.fetch({ limit: 100 })

    while (collection.last().createdAt > date) {
      const data = await messages.fetch({
        limit: 100,
        before: collection.last().id,
      })

      collection = collection.concat(data)
    }

    return collection
  }

  private async logMessage(msg: any) {
    if (this.logMessages)
      await fs.appendFile(this.config.logsDir + '/messages.log', serializeMessage(msg) + '\n')
  }

  private filterMessage = (msg: any) => true

  public setMsgFilter(type: DiscordMessageFilter) {
    this.filterMessage = {
      [DiscordMessageFilter.all]: (msg) => true,
      [DiscordMessageFilter.direct]: (msg) => !msg.channel.guild,
      [DiscordMessageFilter.guild]: (msg) => !msg.channel.guild || this.guilds.has(msg.channel.guild.id),
      [DiscordMessageFilter.none]: (msg) => false,
    }[type]
  }
}

function serializeMessage(msg: any) {
  return JSON.stringify({
    ...msg,
    channel: { ...msg.channel },
    author: { ...msg.author },
  })
}
