import { discord } from 'src/utils/clients';
import Filter from 'bad-words';
import discordChannelIDs from 'src/utils/discordChannelIDs.json';

const filter = new Filter();

discord.elonMusk.on('ready', () => {
  console.log(`Logged in as ${discord.elonMusk.user.tag}!`);
});

discord.elonMusk.on('message', async(msg) => {
  const text = msg.content.toLowerCase();

  if (text.includes('btc') || text.includes('bitcoin'))
    await msg.reply('🤢');

  else if (msg.channel.id === discordChannelIDs.peaceful.general)
    if (filter.isProfane(text))
      await msg.reply('Very disapointed in you :(');
});
