'use strict';

const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const TOKEN = fs.readFileSync('token');
const PORT = 88;
const URL = `https://kraftwerk28.pp.ua:${PORT}`;

const bot = new TelegramBot(TOKEN, { polling: true });

const interaction = new Map([ // тут в пустые поля введите соответствующий текст
    ['Купить криптовалюту', 'text_entry'],
    ['Продать криптовалюту', 'text_entry'],
    ['Заказать гаранта', 'text_entry'],
    ['Правила', 'text_entry'],
    ['Отзывы', 'text_entry'],
    ['Контакты', 'text_entry'],
    ['О нас', 'text_entry'],
])

const texts = Array.from(interaction.keys());
const answers = Array.from(interaction.values());

const keyboard = {
    keyboard: [
        [{ text: texts[0] }, { text: texts[1] }],
        [{ text: texts[2] }, { text: texts[3] }],
        [{ text: texts[4] }, { text: texts[5] }, { text: texts[6] }]
    ]
}

bot.on('text', msg => {
    let i = texts.findIndex(val => msg.text === val);
    if (i !== -1)
        bot.sendMessage(msg.chat.id, answers[i], { reply_to_message_id: msg.message_id });
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        'Выберите из нижеперечисленного:',
        { reply_markup: JSON.stringify(keyboard) }
    );
});
