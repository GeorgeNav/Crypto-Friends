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

// manually embed message: https://discohook.org/?data=eyJtZXNzYWdlcyI6W3siZGF0YSI6eyJjb250ZW50IjpudWxsLCJlbWJlZHMiOlt7InRpdGxlIjoiQ3J5cHRvIE1hcmtldCBGZWFyICYgR3JlZWQgSW5kZXgiLCJ1cmwiOiJodHRwczovL2FsdGVybmF0aXZlLm1lL2NyeXB0by9mZWFyLWFuZC1ncmVlZC1pbmRleC8iLCJjb2xvciI6bnVsbCwiaW1hZ2UiOnsidXJsIjoiaHR0cHM6Ly9hbHRlcm5hdGl2ZS5tZS9jcnlwdG8vZmVhci1hbmQtZ3JlZWQtaW5kZXgucG5nIn19XSwiYXR0YWNobWVudHMiOltdfX1dfQ
export const discord = {
  elonMusk: discordClientFactory(auth.discord.bot.ELONMUSK_APP_TOKEN, chatOnlyIntents),
  whaleAlert: discordClientFactory(auth.discord.bot.WHALE_ALERT_APP_TOKEN, chatOnlyIntents),
}
