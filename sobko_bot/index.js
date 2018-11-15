'use strict';

const inverseSchedule = false;

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const dateEvents = require('date-events')();
const TOKEN = fs.readFileSync('./token', 'utf8');
const bot = new TelegramBot(TOKEN, { polling: true });

const sheds = [
  '9:00 - 15:00',
  '13:00 - 19:00',
]

const sobko = new RegExp('( |^)(с|c)(0|o|о)бк(0|o|о)( |$)', 'i');
let now = new Date().getDate() % 2 === 0 ?
  (inverseSchedule ? sheds[0] : sheds[1]) :
  (inverseSchedule ? sheds[1] : sheds[0]);
const always = inverseSchedule ?
  'Парні числа:  <i>9:00 - 15:00</i>\nНепарні числа:  <i>13:00 - 19:00</i>\n' :
  'Парні числа:  <i>13:00 - 19:00</i>\nНепарні числа:  <i>9:00 - 15:00</i>\n';

const chats = [];

dateEvents.on('date', () => {
  const d = new Date();
  if (d.getDate() % 2 === 0)
    now = inverseSchedule ? sheds[1] : sheds[0];
  else
    now = inverseSchedule ? sheds[0] : sheds[1];
  if (d.getDay() < 1)
    now = 'сьогодні Собко І. І. не працює';
})

bot.on('text', msg => {
  if (sobko.test(msg.text)) {
    work(msg);
  }
});

bot.onText(/\/sobko/, (msg, match) => {
  work(msg);
});

const work = msg => {
  if (!chats.some(val => val.chat_id === msg.chat.id))
    chats.push({ id: msg.chat.id, mId: null });

  const index = chats.findIndex(val => val.id === msg.chat.id);
  if (chats[index].mId !== null)
    bot.deleteMessage(chats[index].id, chats[index].mId);
  bot.sendMessage(
    msg.chat.id,
    `<b>Графік роботи Собко І. І.:</b>\n${always}\nГрафік роботи Собко І. І. на сьогодні:\n<code>${now}</code>\nТелефони реєстратури: <code>204-85-62</code>, <code>204-95-93</code>`,
    { parse_mode: 'html', reply_to_message_id: msg.message_id }
  ).then(msg => {
    chats[index].mId = msg.message_id;
  });
};
