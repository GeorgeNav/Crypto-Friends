import auth from 'src/../auth.json';
import { twitterUsers } from "src/utils/constants"
import discordChannelIDs from 'src/utils/discordChannelIDs.json';
import needle from 'needle';
import { discord } from "src/utils/clients";

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
  const sendMessage = async (tweet: any, channelID: string) => {
    const channel = await discord.elonmusk.channels.fetch(channelID)
    if (channel.isText())
      await channel.send(`@everyone https://twitter.com/${tweet.username}/status/${tweet.id}`).catch(console.error)
  }
  const handleTweet = async (tweet: any) => {
    console.log("Handling Tweet", tweet)

    switch (tweet.author_id) {
      case twitterUsers.test.authorID:
        await sendMessage({
          ...tweet,
          username: twitterUsers.test.username,
        }, discordChannelIDs.text.dev)
        break
      case twitterUsers.elonmusk.authorID:
        sendMessage({
          ...tweet,
          username: twitterUsers.elonmusk.username,
        }, discordChannelIDs.text.tweets)
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
