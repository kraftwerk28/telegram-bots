'use strict';

const testing = !1;
const fs = require('fs');
const https = require('https');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const express = require('express');
const safeEval = require('safe-eval');
const chats = {};

let bot;

if (testing) {
  bot = new TelegramBot(TOKEN, { polling: true });
} else {
  const https_opts = {
    key: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/fullchain.pem')
  };

  const port = 8443;
  const TOKEN = fs.readFileSync('./token.txt', 'utf8');
  const URL = `https://kraftwerk28.pp.ua:${port}`;

  bot = new TelegramBot(TOKEN);
  bot.setWebHook(`${URL}/${TOKEN}`);

  const app = express();
  app.use(bodyParser.json());
  app.post('/' + TOKEN, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  https.createServer(https_opts, app).listen(port);
}

// const myLog = (args) => {
//   const parse = (obj) => {
//     if (obj === null) return null;
//     if (typeof obj === 'function') return `[Function ${obj.name}]`;
//     if (typeof obj === 'object') {
//       if (Array.isArray(obj)) {
//         return `[ ${obj.reduce((res, o) => (
//           res + parse(o) + ', '
//         ), '').replace(/, $/, '')} ]`;
//       } else {
//         return `{ ${Object.keys(obj).reduce((res, k) => (
//           res + `${k}: ${parse(obj[k])}, `), ''
//         ).replace(/, $/, '')} }`;
//       }
//     } else {
//       return typeof obj === 'string' ? `'${obj}'` : obj;
//     }
//   };
//   return args.reduce((res, o) => (res + parse(o) + ' '), '');
// };

bot.onText(/\/toggle_forse_mode/, (msg) => {
  chats[msg.chat.id] = (chats[msg.chat.id] !== undefined) ? !chats[msg.chat.id] : true;
  bot.sendMessage(msg.chat.id, 'Force mode ' + (chats[msg.chat.id] ? 'enabled' : 'disabled'),
    { reply_to_message_id: msg.message_id });
});

bot.on('polling_error', (e) => {
  console.log(e);
});

bot.on('text', (msg) => {
  if (msg.text.charAt(0) !== '/') {
    try {
      let resp = safeEval(msg.text.toString());
      bot.sendMessage(msg.chat.id, `<code>${resp}</code>`,
        { reply_to_message_id: msg.message_id, parse_mode: 'html' });
    } catch (e) {
      if (chats[msg.chat.id]) {
        bot.sendMessage(msg.chat.id, `<code>${e.toString()}</code>`,
          { reply_to_message_id: msg.message_id, parse_mode: 'html' });
      }
    }
  }
});

