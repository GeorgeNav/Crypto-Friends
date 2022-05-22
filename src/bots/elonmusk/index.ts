import { discord, twitter } from "src/utils/clients"
import Filter from "bad-words"
import discordChannelIDs from "src/utils/discordChannelIDs.json"

const filter = new Filter()

discord.elonmusk.on('ready', async () => {
  console.log(`Logged in as ${discord.elonmusk.user.tag}!`)
  twitter.listenToUserTweets()
})

discord.elonmusk.on('message', (msg) => {
  const text = msg.content.toLowerCase()

  if (text.includes('btc') || text.includes('bitcoin'))
    msg.reply('🤢')

  else if (msg.channel.id === discordChannelIDs.peaceful.general)
    if (filter.isProfane(text))
      msg.reply('Very disapointed in you :(')
})
