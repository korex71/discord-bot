const Discord = require('discord.js')
const config = require('../config.json')
const ytsr = require('ytsr')
const ytdl = require('ytdl-core')
const { getInfo } = require('ytdl-getinfo')
const client = new Discord.Client()

const prefix = "."

const queue = new Map()

client.on("ready", _ => {
  console.log('Estou pronto!')
})

client.on("message", async message => {
  if(message.author.bot) return
  if(!message.content.startsWith(prefix)) return

  const commandBody = message.content.slice(prefix.length)
  const args = commandBody.replace(' ', '+')
  const rgx = commandBody.split(' ')
  const command = rgx.shift().toLowerCase()

  // console.log(commandBody, args, command)
  console.log(args)

  const serverQueue = queue.get(message.guild.id)

  if(command === "ping"){
    const timeTaken = Date.now() - message.createdTimestamp
    message.reply(`Pong! latência da mensagem: ${timeTaken}ms`)
  }
  if(command === "play"){
    execute(message, args, serverQueue)
    return
  }
  if(command === "skip"){
    skip(message, serverQueue)
    return
  }
  if(command === "stop"){
    skip(message, serverQueue)
    return
  }
  if(command === "list"){
    serverQueue.songs.map((song, index) => {
      message.channel.send(`[${index}] ${song.title}`)
    })
    
  }
})

async function execute(message, args, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if(!voiceChannel)
    return message.reply(
      "Você precisa estar conectado em um canal de voz para tocar uma música."
    )
  console.log(args)
  const Info = await getInfo(args)
  const songInfo = Info.items[0]
  const song = {
    thumb: songInfo.thumbnail,
    title: songInfo.fulltitle,
    author: songInfo.author,
    url: songInfo.webpage_url
  }

  if(serverQueue){
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)
    return message.channel.send(`${song.title} adicionada na JBL do pai 😎`)
  }else{
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
     };
     // Setting the queue using our contract
     queue.set(message.guild.id, queueContruct);
     // Pushing the song to our songs array
     queueContruct.songs.push(song);
     
     try {
      // Here we try to join the voicechat and save our connection into our object.
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      // Calling the play function to start a song
      play(message.guild, queueContruct.songs[0]);
     } catch (err) {
      // Printing the error message if the bot fails to join the voicechat
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
     }
  }
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id)
  if(!song){
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }
  
  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[1])
    })
    .on("error", error => console.log(error))
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
  serverQueue.textChannel.send(`Tocando: ${song.title}`)
}

function skip(message, serverQueue) {
  if(!message.member.voice.channel)
    return message.channel.send(
      "Você precisa estar em um canal de voz para pular a música."
    )
  if(!serverQueue)
    return message.channel.send("Não há músicas para pular '-'")
  serverQueue.connection.dispatcher.end()
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você precisa estar em um canal de voz para isso."
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function list(message, serverQueue) {
  if(!message.member.voice.channel)
    return message.reply(
      "Você precisa estar em um canal de voz para isso."
    )
}

client.login(config.BOT_TOKEN)