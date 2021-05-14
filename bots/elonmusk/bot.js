require('dotenv').config()
const { Client, Message, TextChannel, Guild } = require('discord.js')
const needle = require('needle')
const Filter = require('bad-words')
const channelIDs = require('./config/channelIDs.json')

const filter = new Filter()

const client = new Client()

// Twitter
const streamURL = `https://api.twitter.com/2/tweets/search/stream`
const tweetAuth = { headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` } }
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const rules = [ {value: 'from:elonmusk'} ]

let currentRules

const getRules = async () => {
  const response = await needle('get', rulesURL, tweetAuth)
  console.log(response.body)
  return response.body
}

const setRules = async () => {
  const data = { add: rules }

  const response = await needle('post', rulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })

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

  const response = await needle('post', rulesURL, data,
    { headers: { 'content-type': 'application/json', ...tweetAuth.headers } })

  return response.body
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`)

  await setRules()
  currentRules = await getRules()

  const stream = await needle.get(streamURL, tweetAuth)

  stream.on('data', (response) => {
    try {
      const json = JSON.parse(response)
      const tweet = json.data.text
      console.log(tweet)
      const tweetsTextChannel = client.channels.cache.get(channelIDs.text.tweets)
      tweetsTextChannel.send('@everyone Elon: ' + tweet)
    } catch (error) {
      console.log('no tweet atm')
    }
  })
})

client.on('message', (msg) => {
  const text = msg.content.toLowerCase()

  if (text.includes('btc') || text.includes('bitcoin'))
    msg.reply('Very energy inefficient crypto currency')
  
  /*
  else if(msg.channel.id === channelIDs.peaceful.peaceful)
    if (filter.isProfane(text))
      msg.reply('Very disapointed in you :(')
  */
})

client.login(process.env.BOT_TOKEN)

process.on('SIGINT', async () => {
  await deleteRules(await currentRules)
  console.log('deleted stream rules')
  process.exit(1)
})
