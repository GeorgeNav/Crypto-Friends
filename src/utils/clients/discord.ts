import { BitFieldResolvable, Client, Intents, IntentsString } from 'discord.js';
import auth from 'src/../auth.json';

const discordClientFactory = (token: string, intents: BitFieldResolvable<IntentsString, number> = []) => {
  const discordClient = new Client({
    intents,
  });
  discordClient.login(token);
  return discordClient;
}

const chatOnlyIntents = [
  Intents.FLAGS.DIRECT_MESSAGES
]

export const discord = {
  elonMusk: discordClientFactory(auth.discord.bot.ELONMUSK_APP_TOKEN, chatOnlyIntents),
  whaleAlert: discordClientFactory(auth.discord.bot.WHALE_ALERT_APP_TOKEN, chatOnlyIntents),
}
