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
const currentRules: TwitterStreamRule[] = [];

type Tweet = {
  author_id: string;
  id: string;
  text: string;
}
type TwitterStreamRule = {
  id: string;
  value: string;
}

type StreamRulesResponseBody = {
  data: TwitterStreamRule[] | undefined;
  meta: {
    set: string;
    result_cout: number;
  }
  errors: Array<TwitterStreamRule & {
    title: string;
    type: string;
  }> | undefined;
}
export const getRules = async(): Promise<TwitterStreamRule[]> => {
  const body = (await needle('get', streamRulesURL, tweetAuth)).body as StreamRulesResponseBody;
  const rules = body.data;
  console.log(rules);
  return rules;
};

const setRules = async(): Promise<TwitterStreamRule[]> => {
  const data = { add: streamRules };
  const body = (await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })).body as StreamRulesResponseBody;
  const addedRules = body.data;
  let allRules: TwitterStreamRule[] = [];
  if(addedRules && Array.isArray(addedRules))
    allRules = addedRules;
  if(body.errors) {
    console.error('Errors setting rules', body);
    if(body.errors.some((e) => e.title === 'DuplicateRule')) {
      const duplicateRules = body.errors
        .filter((error) => error.title === 'DuplicateRule')
        .map((error) => ({
          id: error.id,
          value: error.value,
        }));
      allRules = [...allRules, ...duplicateRules];
    }
  }
  console.log('Twitter Rules', allRules);
  return addedRules;
};

const deleteRules = async(rulesToDelete: TwitterStreamRule[]) => {
  const data = {
    delete: {
      ids: rulesToDelete.map((rule) => rule.id),
    },
  };
  const body = (await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })).body as StreamRulesResponseBody;
  const newRules = body.data;
  console.log('Twitter Rules After Deletion', newRules);
  return body.data;
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
  stream.on('data', (chunk: Buffer) => {
    try {
      const json = JSON.parse(chunk.toString()) as { data: Tweet };
      const tweet = json.data;
      console.log('Tweet:', tweet);
      dataHandler(tweet);
    } catch (error) { }
  });
  ['end', 'error'].forEach((eventName) => {
    stream.on(eventName, () => {
      restartStream();
      console.log(`stream ${eventName}`);
    });
  });
  ['close', 'pause', 'resume'].forEach((eventName: string) => {
    stream.on(eventName, () => { console.log(`stream ${eventName}`); });
  });
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
