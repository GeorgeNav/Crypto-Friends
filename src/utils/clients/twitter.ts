import auth from 'src/../auth.json';
import { TwitterUser, twitterUsers } from 'src/utils/constants';
import discordChannelIDs from 'src/utils/discordChannelIDs.json';
import needle from 'needle';
import { discord } from 'src/utils/clients';
import { Client } from 'discord.js';

const streamURL = 'https://api.twitter.com/2/tweets/search/stream?expansions=author_id';
const streamRulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const tweetAuth = { headers: { Authorization: `Bearer ${auth.twitter.BEARER_TOKEN}` } };
const streamRules = Object.values(twitterUsers).map((twitterUser) => ({
  value: `from:${twitterUser.username}`
}));
let currentRules: TwitterStreamRules = [];

type Tweet = {
  author_id: string;
  id: string;
  text: string;
}
type TwitterStreamRules = Array<{
  id: string;
  value: string;
}>

type StreamRulesResponse = {
  body: {
    data: TwitterStreamRules;
    meta: {
      set: string;
      result_cout: number;
    }
  };
}
export const getRules = async(): Promise<TwitterStreamRules> => {
  const response: StreamRulesResponse = await needle('get', streamRulesURL, tweetAuth) as StreamRulesResponse;
  const rules = response.body.data;
  console.log(rules);
  return rules;
};

const setRules = async(): Promise<TwitterStreamRules> => {
  const data = { add: streamRules };
  const response = await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } }) as StreamRulesResponse;
  const rules = response.body.data;
  console.log('Twitter Rules Set', rules);
  currentRules = rules;
  return rules;
};

const deleteRules = async(rulesToDelete: TwitterStreamRules) => {
  const data = {
    delete: {
      ids: rulesToDelete.map((rule) => rule.id),
    },
  };
  const response = await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } }) as StreamRulesResponse;
  const newRules = response.body.data;
  console.log('Twitter Rules After Deletion', newRules);
  return response.body.data;
};

const getStream = async(): Promise<NodeJS.ReadableStream> => {
  await setRules();
  const stream = needle.get(streamURL, tweetAuth);
  return stream;
};

const delayMiliSeconds = 30000;

const listenToTweets = async(
  streamFactory: () => Promise<NodeJS.ReadableStream>,
  dataHandler: (tweet: Tweet) => void
) => {
  const stream = await streamFactory();
  const restartStream = () => setTimeout(() => {
    listenToTweets(streamFactory, dataHandler)
      .catch(console.error);
  }, delayMiliSeconds);
  stream.on('data', (chunk) => {
    try {
      const json = JSON.parse(chunk as string) as { data: Tweet };
      const tweet = json.data;
      console.log('Tweet:', tweet);
      dataHandler(tweet);
    } catch (error) {
      console.log(error);
    }
  });
  stream.on('end', () => {
    restartStream();
    console.log('stream end');
  });
  stream.on('error', () => {
    restartStream();
    console.log('stream error');
  });
  /*
  ['close', 'pause', 'resume'].forEach((eventName: string) => {
    stream.on(eventName, () => { console.log(`stream ${eventName}`) })
  })
  */
};

const listenToUserTweets = async() => {
  const sendMessage = async(tweet: Tweet, twitterUser: TwitterUser, client: Client) => {
    const channel = await client.channels.fetch(discordChannelIDs.text.tweets);
    const everyone = false;
    if (channel.isText()) {
      const message = `${everyone ? '@everyone ' : ''}https://twitter.com/${twitterUser.username}/status/${tweet.id}`;
      await channel.send(message).catch(console.error);
    }
  };
  const handleTweet = async(tweet: Tweet) => {
    const authorId: string = tweet.author_id;
    switch (authorId) {
    case twitterUsers.elonMusk.authorID:
      await sendMessage(tweet, twitterUsers.elonMusk, discord.elonMusk);
      break;
    case twitterUsers.whaleAlert.authorID:
      await sendMessage(tweet, twitterUsers.whaleAlert, discord.whaleAlert);
      break;
    default:
      console.log('No user exists for this tweet');
    }
  };

  return listenToTweets(getStream, handleTweet);
};

process.on('SIGINT', async() => {
  await deleteRules(currentRules);
  console.log('deleted stream rules');
  process.exit(1);
});

export const twitter = {
  listenToUserTweets,
  currentRules,
};
