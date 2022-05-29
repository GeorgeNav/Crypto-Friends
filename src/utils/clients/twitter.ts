import auth from 'src/../auth.json';
import { TwitterUser, twitterUsers } from "src/utils/constants"
import discordChannelIDs from 'src/utils/discordChannelIDs.json';
import needle from 'needle';
import { discord } from "src/utils/clients";
import { Client } from 'discord.js';

const streamURL = 'https://api.twitter.com/2/tweets/search/stream?expansions=author_id'
const streamRulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const tweetAuth = { headers: { Authorization: `Bearer ${auth.twitter.BEARER_TOKEN}` } }
const streamRules = Object.values(twitterUsers).map((twitterUser) => ({
  value: `from:${twitterUser.username}`
}))

let currentRules

const getRules = async () => {
  const response = await needle('get', streamRulesURL, tweetAuth)
  console.log(response.body)
  return response.body
}

const setRules = async () => {
  const data = { add: streamRules }

  const response = await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })

  console.log('Twitter Rules Set')
  return response.body
}

const deleteRules = async (rules) => {
  if (!Array.isArray(rules.data))
    return null

  const data = {
    delete: {
      ids: rules.data.map((rule) => rule.id),
    },
  }

  const response = await needle('post', streamRulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })

  console.log('Twitter Rules Deleted')
  return response.body
}

const getStream = async () => {
  await setRules()
  currentRules = await getRules()
  const stream = needle.get(streamURL, tweetAuth)
  return stream
}

const delayMiliSeconds = 30000

const listenToTweets = async (streamFactory, dataConsumer) => {
  const stream = await streamFactory()

  stream.on('close', () => { console.log('stream close') })
  stream.on('data', (chunk) => {
    try {
      const json = JSON.parse(chunk)
      console.log('stream chunk valid')
      const tweet = json.data
      dataConsumer(tweet)
    } catch (error) { }
  })
  stream.on('end', async () => {
    setTimeout(() =>
      listenToTweets(streamFactory, dataConsumer), delayMiliSeconds)
    console.log('stream end')
  })
  stream.on('error', () => {
    setTimeout(() =>
      listenToTweets(streamFactory, dataConsumer), delayMiliSeconds)
    console.log('stream error')
  })
  stream.on('pause', () => { console.log('stream pause') })
  stream.on('resume', () => { console.log('stream resume') })
}

const listenToUserTweets = async () => {
  const sendMessage = async (tweet: any, twitterUser: TwitterUser, client: Client) => {
    const channel = await discord.elonMusk.channels.fetch(discordChannelIDs.text.tweets)
    const everyone = false
    if (channel.isText())
      await channel.send(`${everyone ? '@everyone ' : ''}https://twitter.com/${twitterUser.username}/status/${tweet.id}`).catch(console.error)
  }
  const handleTweet = async (tweet: any) => {
    console.log("Handling Tweet", tweet)
    const authorId: string = tweet.author_id;
    switch (authorId) {
      case twitterUsers.elonMusk.authorID:
        sendMessage(tweet, twitterUsers.elonMusk, discord.elonMusk)
        break
      case twitterUsers.whaleAlert.authorID:
        sendMessage(tweet, twitterUsers.whaleAlert, discord.whaleAlert)
        break
      default:
        console.log("No user exists for this tweet")
    }
  }

  return listenToTweets(getStream, handleTweet)
}

process.on('SIGINT', async () => {
  await deleteRules(await currentRules)
  console.log('deleted stream rules')
  process.exit(1)
})

process.once('SIGUSR2', async () => {
  await deleteRules(await currentRules)
  console.log('deleted stream rules')
})

export const twitter = {
  listenToUserTweets,
  currentRules,
}
