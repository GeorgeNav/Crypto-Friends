const { Collection, MessageEmbed } = require('discord.js')
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
})

const displayInfo = async (message, queue, song, event) => {
  const channel = message.channel
  const info = new MessageEmbed()
  info.setTitle(event)
  info.setColor('#00AAFF')
  info.setThumbnail(song.thumbnail)
  info.addFields([
    {
      name: 'Song',
      value: `${song.name} - ${song.formattedDuration}`,
    },
    {
      name: 'Command',
      value: `\`${message.content}\`\n${song.user}`,
    },
  ])
  info.setURL(song.url)
  await channel.send(info)
    .catch(console.error)
  message.delete()
}

discord.distube
  .on("playSong", (message, queue, song) => displayInfo(message, queue, song, 'Playing'))
  .on("addSong", (message, queue, song) => displayInfo(message, queue, song, 'Added to Queue'))
  .on('error', (message, error) => {
    message.channel.send(`An error encoutered: ${error}`)
  })

loadEvents(discord)

discord.commands = new Collection()
discord.aliases = new Collection()

loadCommands(discord)
