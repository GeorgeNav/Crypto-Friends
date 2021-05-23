const { Collection } = require('discord.js')
const {
  loadEvents,
  loadCommands,
} = require('./setup')

const discord = require('./utils/discord')
const Distube = require('distube')
discord.distube = new Distube(discord, {
  searchSongs: false,
  emitNewSongOnly: true,
})

discord.on('ready', async () => {
  console.log(`Logged in as ${discord.user.tag}!`)
  // TODO: create webhook once signed in for elon tweets
})

discord.distube
  .on("playSong", (message, queue, song) =>
    message.channel.send(
      `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}`
    ))
	.on("addSong", (message, queue, song) =>
    message.channel.send(
      `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    ))
  .on('error', (message, error) => {
    message.channel.send(`An error encoutered: ${error}`)
  })

loadEvents(discord)

discord.commands = new Collection()
discord.aliases = new Collection()

loadCommands(discord)