const discord = require('./utils/discord')
const Filter = require('bad-words')
const filter = new Filter()
const { startListeningToElonForever } = require('./utils/twitter')

discord.on('ready', async () => {
  console.log(`Logged in as ${discord.user.tag}!`)
  // TODO: create webhook once signed in for elon tweets
  startListeningToElonForever()
})

discord.on('message', (msg) => {
  const text = msg.content.toLowerCase()

  if (text.includes('btc') || text.includes('bitcoin'))
    msg.reply('You can\'t buy my Teslas anymore with that trash coin')
  
  /*
  else if(msg.channel.id === channelIDs.peaceful.peaceful)
    if (filter.isProfane(text))
      msg.reply('Very disapointed in you :(')
  */
})
