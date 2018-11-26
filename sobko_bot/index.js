'use strict';

const inverseSchedule = false;

// const TelegramBot = require('node-telegram-bot-api');
const TelegramBot = require('telegraf/telegraf');
const fs = require('fs');
const dateEvents = require('date-events')();
const TOKEN = fs.readFileSync(__dirname + '/token', 'utf8');
const bot = new TelegramBot(TOKEN, { username: 'sobko_bot' });

const sheds = [
  '9:00 - 15:00',
  '13:00 - 19:00',
]

const sobko = new RegExp('( |^)(с|c)(0|o|о)бк(0|o|о)( |$)', 'i');
let now = new Date().getDate() % 2 === 0 ?
  (inverseSchedule ? sheds[0] : sheds[1]) :
  (inverseSchedule ? sheds[1] : sheds[0]);
const always = inverseSchedule ?
  `Парні числа:  <i>${sheds[0]}</i>\nНепарні числа:  <i>${sheds[1]}</i>\n` :
  `Парні числа:  <i>${sheds[1]}</i>\nНепарні числа:  <i>${sheds[0]}</i>\n`
  ;

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

const work = ctx => {
  if (!chats.some(val => val.chat_id === ctx.chat.id))
    chats.push({ id: ctx.chat.id, mId: null });

  const index = chats.findIndex(val => val.id === ctx.chat.id);
  if (chats[index].mId !== null)
    ctx.deleteMessage(chats[index].mId);
  ctx.reply(
    `<b>Графік роботи Собко І. І.:</b>\n${always}\nГрафік роботи Собко І. І. на сьогодні:\n<code>${now}</code>\nТелефони реєстратури: <code>204-85-62</code>, <code>204-95-93</code>`,
    { parse_mode: 'html', reply_to_message_id: ctx.message_id }
  ).then(msg => {
    chats[index].mId = msg.message_id;
  });
};

bot.startPolling();
