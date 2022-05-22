const { Client } = require('discord.js')
const discord = new Client()
const auth = require('../config/auth.json')

discord.login(auth.discord.ELON_TOKEN)

module.exports = discord