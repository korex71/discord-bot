const Discord = require("discord.js"),
  DisTube = require("distube"),
  client = new Discord.Client(),
  config = {
    prefix: process.env.BOT_PREFIX || ".",
    token: process.env.BOT_TOKEN || require("../config.json").BOT_TOKEN,
  };
const api = require("./api");
const express = require("express");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static("public"));
app.listen(PORT, () => console.log(PORT));

// Distube Class
const distube = new DisTube(client, {
  searchSongs: true,
  emitNewSongOnly: true,
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift();

  if (command == "play") distube.play(message, args.join(" "));

  if (["repeat", "loop"].includes(command))
    distube.setRepeatMode(message, parseInt(args[0]));

  if (command == "stop") {
    distube.stop(message);
    message.channel.send("Stop the music!");
  }

  if (command == "pause") {
    distube.pause(message);
  }

  if (command == "skip" || command == "fs") distube.skip(message);

  if (["cat", "miau"].includes(command)) {
    api
      .get("v1/images/search")
      .then((res) => {
        message.channel.send(res.url);
      })
      .catch((err) => console.warn(err));
  }

  if (command == "queue") {
    let queue = distube.getQueue(message);
    message.channel.send(
      "Current queue:\n" +
        queue.songs
          .map(
            (song, id) =>
              `**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``
          )
          .slice(0, 10)
          .join("\n")
    );
  }

  if (command == "autoplay") {
    let mode = distube.toggleAutoplay(message);
    message.channel.send("Modo autoplay: `" + (mode ? "On" : "Off") + "`");
  }

  if (
    [`3d`, `bassboost`, `echo`, `karaoke`, `nightcore`, `vaporwave`].includes(
      command
    )
  ) {
    let filter = distube.setFilter(message, command);
    message.channel.send("Filtro de playlist atual: " + (filter || "Off"));
  }
});

// Status template
const status = (queue) =>
  `Volume: \`${queue.volume}%\` | Filter: \`${
    queue.filter || "Off"
  }\` | Loop: \`${
    queue.repeatMode
      ? queue.repeatMode == 2
        ? "All Queue"
        : "This Song"
      : "Off"
  }\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;

// Event listener
distube
  .on("playSong", (message, queue, song) =>
    message.channel.send(
      `Tocando \`${song.name}\` - \`${
        song.formattedDuration
      }\`\nEscolhida por: ${song.user}\n${status(queue)}`
    )
  )
  .on("addSong", (message, queue, song) =>
    message.channel.send(
      `Adicionada ${song.name} - \`${song.formattedDuration}\` para a playlist por ${song.user}`
    )
  )
  .on("playList", (message, queue, playlist, song) =>
    message.channel.send(
      `Tocando da playlist \`${playlist.name}\` (${
        playlist.songs.length
      } songs).\nEscolhida por: ${song.user}\nNow playing \`${
        song.name
      }\` - \`${song.formattedDuration}\`\n${status(queue)}`
    )
  )
  .on("addList", (message, queue, playlist) =>
    message.channel.send(
      `Added \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) to queue\n${status(queue)}`
    )
  )
  // DisTubeOptions.searchSongs = true
  .on("searchResult", (message, result) => {
    let i = 0;
    message.channel.send(
      `**Escolha uma opção abaixo**\n${result
        .map(
          (song) => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``
        )
        .join("\n")}\n*Digite 1-15 para escolher ou cancel para cancelar.*`
    );
  })
  .on("finish", (message) =>
    message.channel.send("Sem mais músicas na playlist.")
  )
  // DisTubeOptions.searchSongs = true
  .on("searchCancel", (message) => message.channel.send(`Pesquisa cancelada.`))
  .on("error", (message, e) => {
    console.error(e);
    message.channel.send("Erro encontrado: " + e);
  });

client.login(config.token);
