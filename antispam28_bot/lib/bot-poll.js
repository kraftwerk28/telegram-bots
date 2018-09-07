'use strict';

process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');

module.exports = (TOKEN, ) => {
  const bot = new TelegramBot(TOKEN);
  bot.startPolling({ polling: true }).then(() => {
    console.log('Bot summoned!');
  });
  return bot;
};
