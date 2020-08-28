const Discord = require('discord.js')

const config = require('../config.json')
const Client = new Discord.Client()
const ytdl = require('discord-ytdl-core')

Client.on("ready", () => {
  console.log('Pai ta on')
})

Client.on("message", msg => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.content === ".play") {
      if (!msg.member.voice.channel) return msg.channel.send("You're not in a voice channel?");
     
      let stream = ytdl("https://www.youtube.com/watch?v=bLZHcnuqscU", {
            filter: "audioonly",
            opusEncoded: true,
            encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
        });
      msg.member.voice.channel.join()
      .then(connection => {
          let dispatcher = connection.play(stream, {
            type: "opus"
          })
          .on("finish", () => {
              msg.guild.me.voice.channel.leave();
          })
      });
  }
});


Client.login(config.BOT_TOKEN)