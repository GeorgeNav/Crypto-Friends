const twitterAuth = require('../config/auth.json').twitter
const channelIDs = require('../config/channelIDs.json')
const needle = require('needle')
const discord = require('./discord')
const { MessageEmbed } = require('discord.js')
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?expansions=author_id'
const streamRulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const tweetAuth = { headers: { Authorization: `Bearer ${twitterAuth.BEARER_TOKEN}` } }

/* const Twitter = require('twitter-v2') // Twitter
const twitter = new Twitter({
  bearer_token: twitterAuth.BEARER_TOKEN,
}) */

const elonmusk = {
  username: 'elonmusk',
  authorID: '44196397',
}
const test = {
  username: 'GeorgeN31729844',
  authorID: '1395907457524846598',
}
const streamRules = [
  { value: `from:${test.username}`},
  { value: `from:${elonmusk.username}` },
]

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
  if(!Array.isArray(rules.data))
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
  const stream = await needle.get(streamURL, tweetAuth)
  return stream
}

delayMiliSeconds = 30000

const listenToElonTweets = async (streamFactory, dataConsumer) => {
  const stream = await streamFactory()

  stream.on('close', () => { console.log('stream close')})
  stream.on('data', (chunk) => {
    try {
      const json = JSON.parse(chunk)
      console.log('stream chunk valid')
      const tweet = json.data
      dataConsumer(tweet)
    } catch (error) {  }
  })
  stream.on('end', async () => {
    setTimeout(() =>
      listenToElonTweets(streamFactory, dataConsumer), delayMiliSeconds)
    console.log('stream end')
  })
  stream.on('error', () => {
    setTimeout(() =>
      listenToElonTweets(streamFactory, dataConsumer), delayMiliSeconds)
    console.log('stream error')
  })
  stream.on('pause', () => { console.log('stream pause')})
  stream.on('resume', () => { console.log('stream resume')})
}

const startListeningToElonForever = async () => {
  const handleTweet = (tweet) => {
    console.log(tweet)

    const sendMessage = async (tweet, channelID) => {
      const channel = discord.channels.cache.get(channelID)
      await channel.send(`@everyone https://twitter.com/${tweet.username}/status/${tweet.id}`)
        .catch(console.error)
    }

    if(tweet.author_id === test.authorID)
      sendMessage({
        ...tweet,
        username: test.username,
      }, channelIDs.text.dev)
    else if(tweet.author_id === elonmusk.authorID)// NOTE: it's elon
      sendMessage({
        ...tweet,
        username: elonmusk.username,
      }, channelIDs.text.tweets)
  }

  return listenToElonTweets(getStream, handleTweet)
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

module.exports = {
  startListeningToElonForever,
  currentRules,
  // twitter,
}