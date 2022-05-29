import { discord } from "src/utils/clients"

discord.whaleAlert.on('ready', async () => {
  console.log(`Logged in as ${discord.whaleAlert.user.tag}!`)
})
