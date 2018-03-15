'use strict';

// const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const jsonarray = require('jsonarray');
const dateEvents = require('date-events')();
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
/*
const https_opts = {
  key: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/kraftwerk28.pp.ua/fullchain.pem')
};

const port = 443;
*/
// const TOKEN = '539991741:AAFFDwGx2aeYXkxfRSb9nSu-p4p5M4D4uAQ';
const TOKEN = '414704813:AAGDLcBceKFXcXRD_3T9LGPEBNiQwc9QG6M';
//const URL = 'https://kraftwerk28.pp.ua';

// const bot = new TelegramBot(TOKEN);
const bot = new TelegramBot(TOKEN, { polling: true });
// bot.setWebHook(`${URL}/${TOKEN}`);
/*
const app = express();
app.use(bodyParser.json());
app.post('/' + TOKEN, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
*/
//#region bot AI

let isRepeating = false;

bot.on('message', msg => {
  if (isRepeating && msg.text.charAt() !== '/')
    bot.sendMessage(msg.chat.id, msg.text.toUpperCase());
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

//#region dick game
const userListsDir = 'dickGame/';
const restricts = [', ти сьогодні вже грав! От криса, думав мене обдурить!??', ', ти грав вже. Чекай і відстань від мене!', ', ти сьогодні грав! От придурок малий!', ', не будь крисаком, мене не обдурити!'];
const restrictMsg = () => {
  const n = Math.floor(restricts.length * Math.random());
  return restricts[n];
};

dateEvents.on('date', () => {
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

const getRandomLength = () => Math.round(Math.random() * 10);

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
    bot.sendMessage(chat_id, fname +
      ', твій песюн виріс на ' +
      delta +
      ' см. Тепер його довжина: ' +
      t[i].dickLength);
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
    bot.sendMessage(msg.chat.id, msg.from.first_name + ', вітаємо! Ти зареєструвався у грі "Найдовший песюн"! Кожного дня ти можеш 1 раз в неї зіграти, і таким чином, виростити свого дружка');
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
/*
const askForGirl = () => {
  let buts = JSON.stringify(
    {

    }
  );
  bot.sendMessage(id, 'Ви дівчина?', {})
}
*/
//#endregion

//#endregion

//#region polling AI

let shouldBeDeleted = [];
const polls = [];
/*
let pollSettingButtons = JSON.stringify({
  inline_keyboard: [
    [{ text: 'Завершити налаштування', callback_data: '\/poll_done' }],
    [{ text: 'Скасувати', callback_data: '\/poll_done' }]]
});
*/
/*bot.once('callback_query', m => {
  if (m.from.id === pollUserId && m.text === '\/poll_done') {
    shouldBeDeleted.forEach(mId => {
      bot.deleteMessage(m.chat.id, mId);
    });
    shouldBeDeleted = [];
    bot.sendMessage(m.chat.id, 'Готово!!!' + poll).then(m => shouldBeDeleted.push(m.message_id));
  }
  else if (m.from.id === pollUserId) {
    poll.push(m.text);
    bot.sendMessage(m.chat.id,
      'Прийнято. Коли завершите, виконайте \/poll_done',
      { reply_to_message_id: m.message_id })
      .then(m => shouldBeDeleted.push(m.message_id));
    ask();
  }
});
*/

bot.on('polling_error', err => {
  console.log(err);
});

const closePoll = msg => {
  const poll = polls.splice(
    polls.findIndex(val => val.chatId === msg.chat.id), 1)[0];
  const getChart = (val, sum) => {
    let str = '';
    let k = Math.floor(10 * (val / sum));
    while (k > 0) {
      str = str.concat('⬛️');
      k--;
    }
    return str;
  };

  shouldBeDeleted.forEach(m => { bot.deleteMessage(msg.chat.id, m) });
  shouldBeDeleted = [];
  const final = poll.answers.sort((a, b) => b.value - a.value);
  let sum = 0;
  for (let i = 0; i < final.length; i++)
    sum += final[i].value;

  let str = 'Фінальні результати голосування:\n\n';
  str = str.concat('<b>' + poll.question + '</b>\n\n');
  for (let i = 0; i < final.length; i++) {
    str = str.concat(
      final[i].text +
      ' :\n' +
      getChart(final[i].value, sum) +
      ' (' +
      Math.floor((final[i].value / sum) * 100) +
      '%)' +
      '\n\n');
  }

  bot.sendMessage(
    msg.chat.id,
    str,
    { parse_mode: 'html' }
  );
};

const displayPollResults = msg => {
  const poll = polls.find(val => val.chatId === msg.chat.id);
  const getChart = (val, sum) => {
    let str = '';
    let k = Math.floor(10 * (val / sum));
    while (k > 0) {
      str = str.concat('⬛️');
      k--;
    }
    return str;
  };
  let str = poll.question + '\n<b>Результати:</b>\n\n';
  let sum = 0;
  for (let i = 0; i < poll.answers.length; i++)
    sum += poll.answers[i].value;
  for (let i = 0; i < poll.answers.length; i++) {
    str = str.concat(
      poll.answers[i].text +
      ' :\n' +
      getChart(poll.answers[i].value, sum) +
      ' (' +
      Math.floor((poll.answers[i].value / sum) * 100) +
      '%)' +
      '\n\n');
  }
  str = str.concat('Щоб закрити голосування, виконайте /poll_close');
  bot.sendMessage(msg.chat.id, str, { parse_mode: 'html' }).then(m => {
    shouldBeDeleted.push(m.message_id);
  });
};

const createPoll = (msg, index) => {
  const getAnswsString = () => {
    let str = '';
    const f = msg => {
      polls[index]
        .answers[parseInt(msg.text.substring(1, msg.text.length)) - 1]
        .value++;
      bot.sendMessage(msg.chat.id,
        'Ви щойно проголосували. Для виведення результатів виконайте /poll_results',
        { reply_to_message_id: msg.message_id }).then(m => shouldBeDeleted.push(m.message_id));
    };
    for (let i = 1; i <= polls[index].answers.length; i++) {
      str = str.concat('/' + i + '. ' + polls[index].answers[i - 1].text + '\n');
      // poll[i].value = 0;
      bot.onText(new RegExp('/' + i), f);
    }
    return str;
  };
  bot.sendMessage(
    msg.chat.id,
    '<b>' + polls[index].question + '</b>\n\n' + getAnswsString(),
    { parse_mode: 'html' }
  ).then(m => {
    polls[index].pollMessageId = m.message_id;
    shouldBeDeleted.push(m.message_id);
    if (msg.chat.type !== 'private')
      bot.pinChatMessage(msg.chat.id, m.message_id);
  });

  bot.onText(/\/poll_results/, msg => {
    displayPollResults(msg);
  });
  bot.onText(/\/poll_close/, msg => {
    if (polls.some(val => val.creatorId === msg.from.id)) {
      closePoll(msg);
    } else {
      bot.getChatMember(msg.chat.id, msg.from.id).then(member => {
        if (member.status === 'administrator')
          closePoll(msg);
        else
          bot.sendMessage(
            msg.chat.id,
            'Ви не створювали голосування та не є адміністратором чату',
            { reply_to_message_id: msg.from.id }).then(m => shouldBeDeleted.push(m.message_id));
      });
    }
  });
  // bot.onText(/\/poll/, () => {
  //   bot.forwardMessage(msg.chat.id, msg.chat.id, polls[index].pollMessageId);
  // });
};

bot.onText(/\/poll_start/, msg => {
  if (!polls.some(e => e.chatId === msg.chat.id))
    polls.push({
      chatId: msg.chat.id,
      creatorId: msg.from.id,
      question: '',
      answers: [],
      pollMessageId: null
    });
  const index = polls.findIndex(val => val.creatorId === msg.from.id);

  const ask = () => {
    bot.once('text', m => {
      if (m.from.id === polls[index].creatorId) {
        if (/\/poll_done/.test(m.text)) {
          shouldBeDeleted.forEach(mId => bot.deleteMessage(m.chat.id, mId));
          shouldBeDeleted = [];
          bot.sendMessage(m.chat.id, 'Готово!!!').then(m => shouldBeDeleted.push(m.message_id));
          createPoll(m, index);
        } else if (m.text.charAt(0) !== '/') {
          polls[index].answers.push({ text: m.text, value: 0 });
          bot.sendMessage(m.chat.id,
            'Прийнято. Вводьте відповіді далі. Коли завершите, виконайте /poll_done',
            { reply_to_message_id: m.message_id })
            .then(ms => shouldBeDeleted.push(ms.message_id));
          ask();
        }
      }
    });
  };

  bot.sendMessage(
    msg.chat.id, 'Введіть запитання. Щоб скасувати, виконайте /poll_done',
    { disable_notification: true, reply_to_message_id: msg.message_id }
  ).then(m => {
    shouldBeDeleted.push(m.message_id);
    bot.once('text', m => { // обробка запитання
      if (m.from.id === polls[index].creatorId) {
        if (/\/poll_done/.test(m.text)) {
          bot.sendMessage(m.chat.id, 'Ви скасували голосування');
          polls.splice(index, 1);
          shouldBeDeleted.forEach(mId => {
            bot.deleteMessage(m.chat.id, mId);
          });
        } else if (m.text.charAt(0) !== '/') {
          polls[index].question = m.text;
          bot.sendMessage(m.chat.id,
            'Запитання прийнято. Тепер введіть першу відповідь. Коли завершите, виконайте /poll_done',
            { reply_to_message_id: m.message_id })
            .then(m => {
              shouldBeDeleted.push(m.message_id);
              ask();
            });
        }
      }
    });
  });

});

//#endregion

// app.listen(port);
// http.createServer(app).listen(80);
// https.createServer(https_opts, app).listen(port);
