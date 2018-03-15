'use strict';

const https = require('https');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const express = require('express');

const TOKEN = '529748541:AAEulXSyaS_6upyBl3W6XxxJTLyFK253r68';
const port = 8443;
const URL = `https://kraftwerk28.pp.ua:${port}`;

const https_options = {
  key: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/fullchain.pem')
}

const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${URL}/${TOKEN}`);

const app = express();
app.use(bodyParser.json())
app.post('/' + TOKEN, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

//#region bot AI
const groups = [];

const play = msg => {
  const i = groups.findIndex(val => val.chat_id === msg.chat.id);
  const index = Math.floor(Math.random() * groups[i].players.length)
  bot.getChatMember(msg.chat.id, groups[i].players[index].id)
    .then(chatmember => {
      if (chatmember.status === 'administrator' || chatmember.status === 'kicked')
        play(msg);
      else {
        bot.kickChatMember(msg.chat.id, groups[i].players[index].id);
        groups.splice(index, 1);
      }
    })
};

bot.onText(/\/play_russian_roulette/, msg => {
  if (!groups.some(val => val.chat_id === msg.chat.id))
    groups.push({ chat_id: msg.chat.id, players: [] });

  let myId = null;
  bot.getMe().then(user => {
    bot.getChatAdministrators(msg.chat.id).then(chatMembers => {
      if (!chatMembers.some(member => member.user.id === user.id)) {
        bot.sendMessage(msg.chat.id, 'Make me admin first, please, lol');
      }
      else if (groups.find(val => val.chat_id === msg.chat.id).players.length === 0)
        bot.sendMessage(msg.chat.id,
          'Nobody was registered yet',
          { reply_to_message_id: msg.message_id });
      else
        play(msg);
    });
  });
});

bot.onText(/\/register/, msg => {
  if (!groups.some(val => val.chat_id === msg.chat.id))
    groups.push({ chat_id: msg.chat.id, players: [] });

  const i = groups.findIndex(val => val.chat_id === msg.chat.id);
  groups[i].players.push(msg.from);
  bot.sendMessage(msg.chat.id,
    'You\'re succesfully registered for game',
    { reply_to_message_id: msg.message_id });
});

bot.onText(/\/unregister/, msg => {
  const i = groups.findIndex(val => val.chat_id === msg.chat.id);
  const playerI = groups[i].players.findIndex(p => p.id === msg.from.id)
  if (playerI === -1)
    bot.sendMessage(msg.chat.id,
      'You are not registered, are u kidding?',
      { reply_to_message_id: msg.message_id });
  else {
    groups[i].players.splice(playerI, 1);
    bot.sendMessage(msg.chat.id,
      'You\'re succesfully unregistered',
      { reply_to_message_id: msg.message_id });
  }
});

//#endregion

https.createServer(https_options, app).listen(port);
