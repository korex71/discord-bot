const Discord = require('discord.js')
const config = require('../config.json')
const ytsr = require('ytsr')
const ytdl = require('ytdl-core')
const { getInfo } = require('ytdl-getinfo')
const client = new Discord.Client()
const token = process.env.BOT_TOKEN || config.BOT_TOKEN
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
  switch (command) {
    case 'sky':
      message.reply('A mãe do cara é top')
      break;
    case 'yuri':
      message.reply('https://media.tenor.com/images/6a12a33514fc6846dfd4f3353f77745f/tenor.gif')
      break;
    case 'ping':
      const timeTaken = Date.now() - message.createdTimestamp
      message.reply(`Pong! latência da mensagem: ${timeTaken}ms`)
      break;
    case 'play':
      execute(message, args, serverQueue)
      break;
    case 'skip':
      skip(message, serverQueue)
      break;
    case 'stop':
      stop(message, serverQueue)
      break;
    case 'skip':
      if(!message.member.voice.channel || !serverQueue.songs) return
      const embed = new Discord.MessageEmbed()
      .setColor('#FF69B4')
      .setTitle('Playlist')
      .addFields(
        serverQueue.songs.map((song, index) => {
          return { name: `[${index+=1}] ${song.title}`, value: song.author }
        })
      )
      .setTimestamp()
      message.reply(embed)
    default:
      break;
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
  console.log(songInfo)
  const song = {
    thumb: songInfo.thumbnail,
    title: songInfo.fulltitle,
    author: songInfo.uploader,
    url: songInfo.webpage_url
  }

  if(serverQueue){
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)
    return message.channel.send(`${song.title} adicionada na playlist 😎`)
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
  console.log('/****/SongURL', song.url)
  const dispatcher = serverQueue.connection
    .play(song.url)
    .on("end", () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .on("error", error => console.log(error))
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
  serverQueue.textChannel.send(`Tocando: ${song.title}`)
}

function skip(message, serverQueue) {
  if(!message.member.voice.channel) return message.reply("Você precisa estar em um canal de voz para pular a música.")
  if(!serverQueue) return message.channel.send("Não há músicas para pular.")
  serverQueue.connection.dispatcher.end()
  serverQueue.songs.shift()
  play(message.guild, serverQueue.songs[0])
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você precisa estar em um canal de voz para isso."
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

client.login(token)
