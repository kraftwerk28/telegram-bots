'use strict';

// const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const JSONArray = require('jsonarray');
const dateEvents = require('date-events')();
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const googleTTS = require('google-tts-api');

const https_opts = {
  key: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/fullchain.pem')
};

const port = 88;
const TOKEN = fs.readFileSync('./token.txt', 'utf8');
const URL = `https://kraftwerk28.pp.ua:${port}`;

const bot = new TelegramBot(TOKEN);

const app = express();
app.use(bodyParser.json());
app.post('/' + TOKEN, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// eating old updates
bot.deleteWebHook().then(async () => {
  let lastUpdateID = 0;
  lastUpdateID = await bot.getUpdates({})
    .then(updates => updates[updates.length - 1].update_id);

  const getUpdateRec = () => {
    const newUpdate = await bot.getUpdates({ offset: lastUpdateID + 1 });

    if (newUpdate.length > 0) {
      console.log('Fetched old updates...');
      lastUpdateID = newUpdate[newUpdate.length - 1].update_id;
      getUpdateRec();
    } else {
      // STARTING
      bot.setWebHook(`${URL}/${TOKEN}`).then(() => {
        console.log('Bot summoned')
      });
    }
  };

  getUpdateRec();
})



//#region bot AI

let isRepeating = false;

bot.on('polling_error', (err) => {
  console.log(err);
});

// -----MAIN TEXT MESSAGE HANDLER---- // 
bot.on('text', msg => {
  if (isRepeating && msg.text.charAt() !== '/')
    bot.sendMessage(msg.chat.id, msg.text.toUpperCase());
  if (!antimats.has(msg.chat.id))
    antimats.set(msg.chat.id, true);
  if (antimats.get(msg.chat.id))
    Antimat(msg);

  //polling
  /*
  const text = msg.text;
  const index = polls.findIndex(val => val.chatId === msg.chat.id);

  if (index !== -1 && polls[index].opened) {
    const answIndex = polls[index].answers.findIndex(val => val.text === text);

    if (answIndex !== -1) {
      polls[index]
        .answers[answIndex]
        .value++;
      bot.sendMessage(msg.chat.id,
        'Ви щойно проголосували. Для виведення результатів виконайте /poll_results',
        { reply_to_message_id: msg.message_id, disable_notification: true })
        .then(m => shouldBeDeleted.push(m.message_id));
    }

  }
  */
});

bot.on('new_chat_participant', msg => {
  bot.sendMessage(msg.chat.id, 'Дороу!');
})

bot.onText(/\/delay ([0-9]+)/, (msg, match) => {
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, `delay reached in ${match[1]} ms.`);
  }, match[1]);
});

bot.onText(/\/myid/, msg => {
  bot.sendMessage(msg.chat.id, 'your ID: ' + msg.from.id);
});

bot.onText(/\/start_repeating/, msg => {
  isRepeating = true;
  bot.sendMessage(msg.chat.id, 'Repeating enabled!');
});
bot.onText(/\/stop_repeating/, msg => {
  isRepeating = false;
  bot.sendMessage(msg.chat.id, 'Repeating stopped!');
});

bot.onText(/\/say/, (msg, match) => {
  const vals = match.input.split(' ');
  googleTTS(vals.splice(2).join(' '), vals[1], 1)   // speed normal = 1 (default), slow = 0.24
    .then(function(url) {
      bot.sendVoice(msg.chat.id, url, { reply_to_message_id: msg.message_id });
    })
    .catch(function(err) {
      console.error(err.stack);
    })
});

//#region dick game
const userListsDir = 'dickGame/';
const restricts = [
  ', ти сьогодні вже грав!',
  ', ти грав вже. Чекай і відстань від мене!',
  ', ти сьогодні грав!',
  ', мене не обдурити!',
  ', -_-'
];
const restrictMsg = () => {
  const n = Math.floor(restricts.length * Math.random());
  return restricts[n];
};

dateEvents.on('22:00', () => {
  const files = fs.readdirSync(userListsDir);
  files.forEach(val => {
    if (val.charAt(0) !== '.') {
      const data = fs.readFileSync(userListsDir + val, { encoding: 'utf8' });
      const t = JSON.parse(data);
      t.forEach(e => e.played = false);
      fs.writeFileSync(userListsDir + val, JSON.stringify(t));
    }
  });
});

const getRandomLength = () => Math.round(Math.random() * 20) - 10;

const playDickGame = (user_id, chat_id, fname, file) => {
  const data = fs.readFileSync(file, 'utf8');
  const t = JSON.parse(data);
  const i = t.findIndex(user => user.id === user_id);

  if (t[i].played) {
    bot.sendMessage(chat_id, fname + restrictMsg());
  } else {
    t[i].played = true;
    const delta = getRandomLength();
    t[i].dickLength += delta;
    if (t[i].dickLength <= 0) {
      t[i].dickLength = 0;
      bot.sendMessage(chat_id, fname + ', в тебе немає песюна');
    } else {
      bot.sendMessage(chat_id, fname +
        (delta < 0 ? ', твій песюн скоротився на ' : ', твій песюн виріс на ') +
        Math.abs(delta) +
        ' см. Тепер його довжина: ' +
        t[i].dickLength);
    }
  }
  fs.writeFileSync(file, JSON.stringify(t));
};

const addUserToJSON = (id, fname, file) => {
  const data = fs.readFileSync(file, { encoding: 'utf8' });
  const t = JSON.parse(data);
  t.push({ id, fname, dickLength: 0, played: false });
  fs.writeFileSync(file, JSON.stringify(t));
};

const userExists = (id, file) => {
  const data = fs.readFileSync(file, 'utf8');
  const t = JSON.parse(data);
  return t.find(user => user.id === id) !== undefined;
};

bot.onText(/\/dick/, msg => {

  const file = userListsDir + msg.chat.id + 'dg.json';
  if (!fs.existsSync(file))
    fs.writeFileSync(file, '[]');
  if (!userExists(msg.from.id, file)) {
    addUserToJSON(msg.from.id, msg.from.first_name, file);
    bot.sendMessage(msg.chat.id, msg.from.first_name + ', ти зареєструвався у грі "Найдовший песюн"!');
  }

  playDickGame(msg.from.id, msg.chat.id, msg.from.first_name, file);
});

bot.onText(/\/stats/, msg => {
  fs.readFile(userListsDir + msg.chat.id + 'dg.json', 'utf8', (err, data) => {
    if (data) {
      const stats = JSON.parse(data);
      let rate = '<b>Рейтинг гри</b>:\n\n';
      for (let i = 0; i < stats.length; i++) {
        rate = rate.concat(stats[i].fname + ' має песюн довжиною: ' + stats[i].dickLength + ' см.\n');
      }
      bot.sendMessage(msg.chat.id, rate, { parse_mode: 'html' });
    } else bot.sendMessage(msg.chat.id, 'Ще ніхто не грав');
  });
});

bot.onText(/\/top/, msg => {
  fs.readFile(userListsDir + msg.chat.id + 'dg.json', 'utf8', (err, data) => {
    if (data) {
      const stats = JSON.parse(data);
      let str = '<b>Топ гравців:</b>\n\n';
      const toprate = stats.sort((user1, user2) => user2.dickLength - user1.dickLength);
      for (let i = 0; i < toprate.length; i++) {
        str = str.concat('<b>' + (i + 1).toString() + '</b>. ' + toprate[i].fname + ' має песюн довжиною: ' + toprate[i].dickLength + ' см.\n');
      }
      bot.sendMessage(msg.chat.id, str, { parse_mode: 'html' });
    } else bot.sendMessage(msg.chat.id, 'Ще ніхто не грав');
  });
});

//#region antimat
let antimats = new Map();

const mats = new RegExp(
  '(^| )хул(е|і)( |$)|(о|а|по|на| |^)ху(и|й|я|ю|і|ї|є|е|ё)|(^| )бля(т|д)|п(и|е|ё)зд(а|и|ю|і|ю|у|ец|ець|єц)|йоб|(ё|е|є|ї)ба(в|т|л)|су(к|чк)(а|и|і|ара)|п(и|і|е|є)дор|пидорас',
  'i'
);

const matRectrictions = [
  'не матюкайся',
  'не матерись',
  'матюк на матюку - то матюковий сєкс',
  'ти пєтух матюкливий',
  'мат - ето плоха'
];

bot.onText(/\/antimat_on/, msg => { antimats.set(msg.chat.id, true) });

bot.onText(/\/antimat_off/, msg => {
  bot.sendMessage(msg.chat.id, 'ок');
  antimats.set(msg.chat.id, false)
});

const matRestriction = () => {
  const n = Math.floor(matRectrictions.length * Math.random());
  return matRectrictions[n];
};

const Antimat = msg => {
  const text = msg.text;
  if (mats.test(text))
    bot.sendMessage(msg.chat.id,
      matRestriction(),
      { reply_to_message_id: msg.message_id });
};
//#endregion

//#region timur
let stickerer;
let stickCnt = 0;
bot.onText(/\/timur_start(.*) ([0-9]+)/, (msg, match) => {
  stickCnt = parseInt(match[2]);
  if (stickCnt < 100)
    stickerer = setInterval(() => {
      stickCnt--;
      if (stickCnt >= 0) {
        bot.sendSticker(msg.chat.id, 'CAADAgADBwADlNpLF2eKTjCI8ksIAg');
      } else {
        clearInterval(stickerer);
      }
    }, 3000);
  else {
    bot.sendMessage(msg.chat.id, '...too many @tshemsedinov\'s');
  }
});

bot.onText(/\/timur_stop/, msg => {
  clearInterval(stickerer);
  stickCnt = 0;
});
//#endregion

//#endregion


// app.listen(port);
// http.createServer(app).listen(80);
https.createServer(https_opts, app).listen(port);
