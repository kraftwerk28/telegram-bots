'use strict';

// const http = require('http');
// const https = require('https');
// const express = require('express');
// const bodyParser = require('body-parser');

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const keyboards = require('./keyboards.js');
const longTimeout = require('long-timeout');

const dateTime = require('node-datetime');

const time = dateTime.create();
dateTime.setOffsetInHours(2);
const timeFormat = 'd.m.y H:M';

const TOKEN = fs.readFileSync('token');
const bot = new TelegramBot(TOKEN, { polling: true });

// let keyb = keyboards.mainKeyboard;



const forms = [];
const users = [];
const tasks = [];

const curriers = -1001274234404;/*-273982940;*/
const feedback = -1001274234404;

const pricePhoto = fs.readFileSync('prices.jpg');
const about = fs.readFileSync('about_us', 'utf8');
const map = fs.readFileSync('map.jpg');

//#region forms & users
const addForm = user => {
  const i = forms.findIndex(f => f.id === user.id);
  if (i === -1) {
    const form = { id: user.id, user, text: '', messageId: null, completed: false };

    bot.onText(new RegExp(`/complete_${form.id}`), msg => {
      form.completed = true;
      bot.sendMessage(curriers, `@${msg.from.username} выполнил заказа`, { reply_to_message_id: form.messageId });
      bot.editMessageText(getFullForm(form), { message_id: form.messageId, chat_id: curriers });
    });
    bot.onText(new RegExp(`/uncomplete_${form.id}`), msg => {
      form.completed = false;
      bot.sendMessage(curriers, `@${msg.from.username} отменил выполнение заказа`, { reply_to_message_id: form.messageId });
      bot.editMessageText(getFullForm(form), { message_id: form.messageId, chat_id: curriers });
    });
    forms.push(form);
    return form;
  }
}

const deleteForm = id => {
  const i = forms.findIndex(val => val.id === id);
  forms.splice(i, 1);
};

const addUser = user => {
  if (!users.some(u => u.id === user.id)) {
    users.push({ id: user.id, user, keyboard: keyboards.mainKeyboard });
    bot.sendMessage(user.id, '...', { reply_markup: keyboards.mainKeyboard });
  }

}

const deleteUser = user => {
  const i = users.findIndex(u => u.id === user.id);
  users.splice(i, 1);
}
//#endregion

bot.on('new_chat_members', () => { console.log('new added') });

bot.on('text', msg => {
  bot.getChat(msg.chat.id).then(chat => {
    if (chat.type === 'private' && msg.text.charAt(0) !== '/') {
      addUser(msg.from);
      addForm(msg.from);
      const t = handleKeyboard(msg);
      if (!t)
        appendForm(msg);
    }
    // if (!handleKeyboard(msg))
    //   appendForm(msg);
  });
});

bot.onText(/\/start/, msg => {
  bot.getChat(msg.chat.id).then(chat => {
    if (chat.type !== 'private')
      bot.sendMessage(msg.chat.id,
        'Бот предназначен только для приватных чатов: @kpideliverer_bot');
    else {
      bot.sendMessage(msg.chat.id, 'Добро пожаловать!', { reply_markup: JSON.stringify(keyboards.mainKeyboard) });
      // addForm(msg.from);
      // addUser(msg.from);
    }
  });
});

bot.onText(/\/order/, msg => {
  const form = forms.find(f => f.id === msg.from.id);
  let t = '';

  form.completed ?
    t += '✅ выполнено\n' :
    t += '❌ не выполнено\n';
  // t += `Заказ от @${form.user.username}:\n`
  t += form.text;
  // t += `\n/complete_${form.id} - выполнить\n/uncomplete_${form.id} - отменить выполнение`
  bot.sendMessage(msg.chat.id, t);
});

bot.onText(/\/subscribers/, msg => {
  const id = msg.chat.id;
  if (id === curriers) {
    bot.sendMessage(
      id,
      `<b>Количество пользователей на данный момент:</b> ${users.length}`,
      { parse_mode: 'html' }
    );
  }
});

bot.onText(/\/end/, msg => {
  bot.sendMessage(msg.chat.id, 'Ok!', { reply_markup: { remove_keyboard: true } });
});

bot.onText(/\/tasks/, msg => {
  const id = msg.chat.id;
  if (id === curriers) {
    forms.forEach(form => {
      bot.sendMessage(id, getFullForm(form), { parse_mode: 'html' });
    });
  }
});

bot.onText(/\/pending_tasks/, msg => {
  const id = msg.chat.id;
  if (id === curriers) {
    forms.forEach(form => {
      if (!form.completed)
        bot.sendMessage(id, getFullForm(form), { parse_mode: 'html' });
    });
  }
});

const handleKeyboard = (msg) => {
  let keyb;
  const userIndex = users.findIndex(u => u.user.id === msg.from.id);
  const formIndex = forms.findIndex(f => f.id === msg.from.id);

  if (userIndex > -1)
    keyb = users.find(u => u.id === msg.from.id).keyboard;

  if (keyb && formIndex > -1) {
    // if (keyb.waiting) {
    //   forms[formIndex].text += `${msg.text}\n`;
    // }
    for (let i = 0; i < keyb.keyboard.length; i++) {
      if (keyb.keyboard[i].some(button => {
        if (button.text === msg.text) {
          const node = keyboards[button.node];

          if (button.formText) {
            forms[formIndex].text += `\n${button.text}\n`;
          }

          if (button.content)
            if (button.content === 'photo')
              sendPrices(msg);
            else if (button.content === 'order')
              doOrder(msg);
            else if (button.content === 'about')
              sendAbout(msg);
            else
              bot.sendMessage(msg.chat.id,
                `${button.content}`,
                { parse_mode: 'html' });

          if (node === null || node === undefined) {
            keyb = keyboards.mainKeyboard;
            bot.sendMessage(msg.chat.id,
              // keyb.startMessage,
              '...',
              { reply_markup: JSON.stringify(keyb), parse_mode: 'html' });
          } else {
            keyb = node;
            bot.sendMessage(msg.chat.id,
              `${keyb.startMessage}`,
              // '...',
              { reply_markup: JSON.stringify(keyb), parse_mode: 'html' });
            // content handler
            // if (keyb.content) {
            //   let c = keyb.content;
            //   if (c === 'photo')
            //     sendPrices();
            //   else
            //     bot.sendMessage(msg.chat.id,
            //       `${keyb.startMessage}\n\n${c}`,
            //       { reply_markup: JSON.stringify(keyb), parse_mode: 'html' });
            // } else
            //   bot.sendMessage(msg.chat.id,
            //     `${keyb.startMessage}`,
            //     { reply_markup: JSON.stringify(keyb), parse_mode: 'html' });

            users[userIndex].keyboard = keyb;
          }
          return true;
        }
      })) {
        users[userIndex].keyboard = keyb;
        return true;
        break;
      }
    }
    return false;
  }
  else
    bot.sendMessage(msg.chat.id, 'Вы не оформляли заказ. Выполните /start, чтобы оформить');
  return true;
};

const appendForm = msg => {
  const userIndex = users.findIndex(u => u.user.id === msg.from.id);
  const formIndex = forms.findIndex(f => f.id === msg.from.id);
  let keyb;
  if (userIndex > -1)
    keyb = users.find(u => u.id === msg.from.id).keyboard;
  if (keyb && keyb.waiting) {
    if (keyb === keyboards.orderKeyboard)
      forms[formIndex].text += `${msg.text}\n`;
    else if (keyb === keyboards.feedback)
      sendFeedback(msg);
  }

  return true;
};

const sendFeedback = msg => {
  bot.sendMessage(
    feedback,
    `<b>Отзыв от @${msg.from.username}:</b>\n${msg.text}`,
    { parse_mode: 'html' }
  );
  const k = keyboards.mainKeyboard;
  users.find(val => val.id === msg.from.id).keyboard = k;
  bot.sendMessage(
    msg.chat.id,
    `Ваш отзыв отправлен`,
    { reply_markup: JSON.stringify(k) }
  );
};

const doOrder = msg => {
  const formIndex = forms.findIndex(f => f.id === msg.from.id);
  let form;

  if (formIndex > -1) {
    form = forms[formIndex];
  }

  if (form.text === '')
    bot.sendMessage(msg.chat.id, 'Ваш заказ пуст.');
  else
    bot.sendMessage(msg.chat.id, getPartForm(form), { parse_mode: 'html', reply_markup: keyboards.confirmOrder }).then(msg => {
      bot.once('callback_query', cq => {
        console.log(cq);
        if (cq.data === 'yes') {
          bot.sendMessage(curriers, getFullForm(form), { parse_mode: 'html' }).then(msg => {
            forms[formIndex].messageId = msg.message_id;
          });
          // bot.answerCallbackQuery({})
          bot.sendMessage(msg.message.chat.id, 'Ваш заказ отправлен в обработку');
          bot.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Ваш заказ отправлен в обработку'
          });
        }
        else {
          deleteForm(cq.from.id);
          bot.sendMessage(msg.message.chat.id, 'Вы отменили заказ.\nДля продолжения, оформите заказ заново');
          bot.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Вы отменили заказ.\nДля продолжения, оформите заказ заново'
          });
        }

        // bot.answerCallbackQuery({ callback_query_id: cq.id });
      });
    });
  // bot.sendMessage(curriers, getFullForm(form)).then(msg => {
  //   forms[formIndex].messageId = msg.message_id;
  // });
  longTimeout.setTimeout(() => {
    bot.removeTextListener(new RegExp(`/complete_${form.id}`));
    bot.removeTextListener(new RegExp(`/uncomplete_${form.id}`));
    // forms.splice(forms.findIndex(f => f.id === user.id), 1);
    deleteForm(msg.from.id);
    bot.deleteMessage(curriers, form.messageId);
  }, 1000 * 60 * 60 * 24); // 24 hours
};

const sendAbout = (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, about).then(() => {
    bot.sendPhoto(id, map);
  });
};

const sendPrices = (msg) => {
  bot.sendPhoto(msg.chat.id, pricePhoto);
};

const getFullForm = (form) => {
  let t = '';

  form.completed ?
    t += '✅ выполнено\n' :
    t += '❌ не выполнено\n';
  t += `${time.format(timeFormat)}\n\n`;
  t += `Заказ от @${form.user.username}:\n\n`
  t += form.text;
  t += `\n/complete_${form.id} - выполнить\n/uncomplete_${form.id} - отменить выполнение`;

  return t;
};

const getPartForm = (form) => {
  let t = '';
  t += `${time.format(timeFormat)}\n\n`;
  // form.completed ?
  //   t += '✅ выполнено\n' :
  //   t += '❌ не выполнено\n';
  t += `Заказ от @${form.user.username}:\n\n`
  t += form.text;
  t += '\n\nВы подтверждаете заказ?';
  // t += `\n/complete_${form.id} - выполнить\n/uncomplete_${form.id} - отменить выполнение`
  return t;
};

// bot.on('polling_error', err => { console.log(err.code) });

bot.onText(/\/chatId/, (msg) => {
  bot.sendMessage(msg.chat.id, `This chat id: ${msg.chat.id}`);
});
