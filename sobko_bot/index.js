'use strict';

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const dateEvents = require('date-events')();
const TOKEN = fs.readFileSync('./token', 'utf8');
const bot = new TelegramBot(TOKEN, { polling: true });

const sobko = new RegExp('( |^)(с|c)(0|o|о)бк(0|o|о)( |$)', 'i');
let now = new Date().getDate() % 2 === 0 ? '12:00 - 18:00' : '9:00 - 16:00';
const always = 'Парні числа:  <i>13:00 - 19:00</i>\nНепарні числа:  <i>9:00 - 15:00</i>\n'
let mId = 0;
const chats = [];

dateEvents.on('date', () => {
    const d = new Date();
    if (d.getDate() % 2 === 0)
        now = '13:00 - 19:00';
    else
        now = '9:00 - 15:00';
    if (d.getDay() < 1)
        now = 'сьогодні Собко І. І. не працює';
})

bot.on('text', msg => {
    if (sobko.test(msg.text)) {
        work(msg);
    }
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
