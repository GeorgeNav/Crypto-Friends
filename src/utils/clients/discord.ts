import { BitFieldResolvable, Client, Intents, IntentsString } from 'discord.js';
import auth from 'src/../auth.json';

const discordClientFactory = (token: string, intents: BitFieldResolvable<IntentsString, number> = []) => {
  const discordClient = new Client({
    intents,
  });
  discordClient.login(token);
  return discordClient;
}

export const discord = {
  elonmusk: discordClientFactory(auth.discord.bot.ELONMUSK_APP_TOKEN, [
    Intents.FLAGS.DIRECT_MESSAGES
  ]),
}
