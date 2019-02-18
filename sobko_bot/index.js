'use strict';

const inverseSchedule = false;

// const TelegramBot = require('node-telegram-bot-api');
const TelegramBot = require('telegraf/telegraf');
const fs = require('fs');
const dateEvents = require('date-events')();

const TOKEN = fs.readFileSync(__dirname + '/token', 'utf8');
const bot = new TelegramBot(TOKEN, { username: 'sobko_bot' });

const oPrivet = fs.readFileSync(__dirname + '/assets/oh_hi.mp3');
const aMozhetTy = fs.readFileSync(__dirname + '/assets/no_u.mp3');

const printer8id = 257;
const hostel8chatId = -1001086783945;
const LSChatID = 343097987;
const lastMsg = { chatId: null, messageId: null };

const sheds = [
  '9:00 - 15:00',
  '13:00 - 19:00',
];

let now = new Date().getDate() % 2 === 0 ?
  (inverseSchedule ? sheds[0] : sheds[1]) :
  (inverseSchedule ? sheds[1] : sheds[0]);
const always = inverseSchedule ?
  `Парні числа:  <i>${sheds[0]}</i>\nНепарні числа:  <i>${sheds[1]}</i>\n` :
  `Парні числа:  <i>${sheds[1]}</i>\nНепарні числа:  <i>${sheds[0]}</i>\n`;

/** @type {Array.<>} */
const chats = [];

dateEvents.on('date', () => {
  const d = new Date();
  if (d.getDate() % 2 === 0)
    now = inverseSchedule ? sheds[0] : sheds[1];
  else
    now = inverseSchedule ? sheds[1] : sheds[0];
  if (d.getDay() < 1)
    now = 'сьогодні Собко І. І. не працює';
});

bot.command('sobko', (ctx) => {
  work(ctx);
});

bot.hears(/(?: |^)[сcs][0оo](?:бк|bk)[0оo](?: |$)/i, (ctx) => {
  work(ctx);
});

bot.hears(/пидор([^a]|$)/i, (ctx) => {
  ctx.replyWithVoice(
    { source: aMozhetTy, filename: 'no u.mp3' },
    { reply_to_message_id: ctx.message.message_id }
  );
});

bot.hears(/печат/i, (ctx) => {
  if (+ctx.chat.id === LSChatID) {
    // if (+ctx.chat.id === hostel8chatId) {
    if (!chats.some(val => val.chat_id === ctx.chat.id))
      chats.push({ id: ctx.chat.id, mId: null });

    const index = chats.findIndex(val => val.id === ctx.chat.id);
    bot.telegram.forwardMessage(ctx.chat.id, hostel8chatId, printer8id)
      .then(msg => { chats[index].mId = msg.message_id; });
  }
});

bot.on('new_chat_members', (ctx) => {
  ctx.replyWithVoice(
    { source: oPrivet, filename: 'hi.mp3' },
    { reply_to_message_id: ctx.message.message_id }
  );
});

bot.command('dellast', (ctx) => {
  if (ctx.chat.id === LSChatID) {
    for (let i = 0; i < chats.length; ++i) {
      bot.telegram.deleteMessage(chats[i].id, chats[i].mId);
      chats[i].mId = null;
    }
  }
});

const work = ctx => {
  if (!chats.some(val => val.chat_id === ctx.chat.id))
    chats.push({ id: ctx.chat.id, mId: null });

  const index = chats.findIndex(val => val.id === ctx.chat.id);
  if (chats[index].mId !== null) {
    ctx.deleteMessage(chats[index].mId);
  }
  ctx.reply(
    `<b>Графік роботи Собко І. І.:</b>\n${always}\nГрафік роботи Собко І. І. на сьогодні:\n<code>${now}</code>\nТелефони реєстратури: <code>204-85-62</code>, <code>204-95-93</code>`,
    { parse_mode: 'html', reply_to_message_id: ctx.message_id }
  ).then(msg => {
    chats[index].mId = msg.message_id;
  });
};


function main() {
  bot.startPolling();
}

// eating old updates
(async () => {
  let lastUpdateID = 0;
  const getUpdateRec = async () => {
    const newUpdate =
      await bot.telegram.getUpdates(undefined, 100, lastUpdateID + 1);

    if (newUpdate.length > 0) {
      lastUpdateID = newUpdate[newUpdate.length - 1].update_id;
      console.log('Fetched old updates... ' + lastUpdateID);
      getUpdateRec();
    } else {
      // STARTING
      main();
    }
  };
  getUpdateRec();
})();
