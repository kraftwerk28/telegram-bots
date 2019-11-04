'use strict';

const inverseSchedule = false;

require('dotenv').config()
const TelegramBot = require('telegraf/telegraf');
const { resolve } = require('path')
const fs = require('fs');
const dateEvents = require('date-events')();

const { TOKEN, USERNAME } = process.env
const bot = new TelegramBot(TOKEN, { username: USERNAME });

const oPrivet = fs.readFileSync(resolve('./assets/01.mp3'));
const aMozhetTy = fs.readFileSync(resolve('./assets/02.mp3'));
const valakas = fs.readFileSync(resolve('./assets/03.mp3'))

// const printer8id = 257;
// const hostel8chatId = -1001086783945;
// const LSChatID = 343097987;
// const lastMsg = { chatId: null, messageId: null };

const sheds = {
  even: '13:00 - 19:00',
  odd: '09:00 - 15:00'
};

let now = new Date().getDate() % 2 === 0 ?
  (inverseSchedule ? sheds.even : sheds.odd) :
  (inverseSchedule ? sheds.odd : sheds.even);
const always = inverseSchedule
  ? `Парні числа:  <i>${sheds.even}</i>\nНепарні числа:  <i>${sheds.odd}</i>\n`
  : `Парні числа:  <i>${sheds.odd}</i>\nНепарні числа:  <i>${sheds.even}</i>\n`;

/** @type {Array.<>} */
const chats = [];

dateEvents.on('date', () => {
  const d = new Date();
  if (d.getDate() % 2 === 0)
    now = inverseSchedule ? sheds.even : sheds.odd;
  else
    now = inverseSchedule ? sheds.odd : sheds.even;
  if (d.getDay() < 1)
    now = 'сьогодні Собко І. І. не працює';
});

bot.command('sobko', (ctx) => {
  work(ctx);
});

bot.hears(/(?: |^)[сcs][0оo](?:бк|bk)[0оo](?: |$)/i, (ctx) => {
  work(ctx);
});

bot.hears(/п[иіе]д[оа]?р(?:ас)?$/i, (ctx) => {
  ctx.replyWithVoice(
    { source: aMozhetTy, filename: 'no u.mp3' },
    { reply_to_message_id: ctx.message.message_id }
  );
});

bot.hears(/д[о0][лв][б6][о0]([её]|й[о0])[б6]/i, (ctx) => {
  ctx.replyWithVoice(
    { source: valakas, filename: 'no u.mp3' },
    { reply_to_message_id: ctx.message.message_id }
  );
});

// bot.hears(/печат/i, (ctx) => {
//   if (+ctx.chat.id === LSChatID) {
//     // if (+ctx.chat.id === hostel8chatId) {
//     if (!chats.some(val => val.chat_id === ctx.chat.id))
//       chats.push({ id: ctx.chat.id, mId: null });

//     const index = chats.findIndex(val => val.id === ctx.chat.id);
//     bot.telegram.forwardMessage(ctx.chat.id, hostel8chatId, printer8id)
//       .then(msg => { chats[index].mId = msg.message_id; });
//   }
// });

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
    [
      '<b>Графік роботи Собко І. І.:</b>',
      always,
      'Графік роботи Собко І. І. на сьогодні:',
      `<code>${now}</code>`,
      'Телефони реєстратури: <code>204-85-62</code>, <code>204-95-93</code>'
    ].join('\n'),
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
