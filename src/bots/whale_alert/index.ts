import { discord } from 'src/utils/clients';

discord.whaleAlert.on('ready', () => {
  console.log(`Logged in as ${discord.whaleAlert.user.tag}!`);
});
