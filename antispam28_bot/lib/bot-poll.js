'use strict';

process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const clk = require('chalk');

const _sendMessage = TelegramBot.prototype.sendMessage;
TelegramBot.prototype.sendMessage = function (chatId, text, options) {
  _sendMessage.call(this, chatId, `<code>${text}</code>`,
    { ...options, parse_mode: 'HTML' });
}

TelegramBot.prototype.isAdmin = function (chatId) {
  return new Promise((resolve, reject) => {
    this.getMe()
      .then((user) => user.id)
      .then((id) => {
        this.getChat(chatId).then((chat) => {
          if (chat.all_members_are_administrators) {
            resolve(true);
            return;
          }
        }).then(() => {
          this.getChatMember(chatId, id)
            .then((chatMember) => {
              if (chatMember.status === 'administrator') {
                resolve(true);
              } else {
                resolve(false);
              }
              return;
            })
        });
      })
  })

}

const kickUser = TelegramBot.prototype.kickChatMember;
TelegramBot.prototype.kickChatMember = function (chatId, userId) {
  return kickUser.call(this, chatId, userId)
    .catch((reason) => {
      this.getChatMember(chatId, userId)
        .then((member) => {
          this.sendMessage(chatId, `Can\'t ban user${member.user.username ? (' @' + member.user.username) : ''}. I must be admin here :(`)
        });
    })
}

module.exports = (TOKEN) => {
  const bot = new TelegramBot(TOKEN);
  bot.startPolling({ polling: true })
    .then(() => {
      console.log(clk.bold.greenBright('Bot summoned!'));
    });

  return bot;
};
