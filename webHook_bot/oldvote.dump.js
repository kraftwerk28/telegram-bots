const askForGirl = () => {
  let buts = JSON.stringify(
    {

    }
  );
  bot.sendMessage(id, 'Ви дівчина?', {})
}

//#endregion


//#region polling AI
const polledUsers = [];
let shouldBeDeleted = [];
const polls = [];

const getChart = (val, sum) => {
  let str = '';
  let k = Math.floor(10 * (val / sum));
  while (k > 0) {
    str = str.concat('⬛️');
    k--;
  }
  return str;
};

const generateButtons = poll => {
  const buttons = {
    keyboard: []
  }
  poll.answers.forEach((a, index) => {
    buttons.keyboard.push([{ text: a.text }])
  });
  return JSON.stringify(buttons);
};

const deletePollMessages = msg => {
  shouldBeDeleted.forEach(mId => bot.deleteMessage(msg.chat.id, mId));
  shouldBeDeleted = [];
};

const closePoll = msg => {
  deletePollMessages(msg);
  const poll = polls.splice(
    polls.findIndex(val => val.chatId === msg.chat.id), 1)[0];
  if (poll) {
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
  } else {
    bot.sendMessage(msg.chat.id, 'Голосування ще не відкрито');
  }

};

const displayPollResults = msg => {
  const poll = polls.find(val => val.chatId === msg.chat.id);
  if (poll) {
    let str = poll.question + '\n<b>Результати:</b>\n\n';
    let sum = 0; for (let i = 0; i < poll.answers.length; i++)
      sum += poll.answers[i].value;

    if (sum === 0)
      bot.sendMessage(msg.chat.id, 'Ще ніхто не голосував');
    else {
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
    }

  } else
    bot.sendMessage(msg.chat.id, 'Голосування поки немає...');

};

const createPoll = (msg, index) => {
  const getAnswsString = () => {
    let str = '';
    const f = msg => {
      polls[index]
        .answers[parseInt(msg.text.split('. ')[0].substring(1, msg.text.length)) - 1]
        .value++;
      bot.sendMessage(msg.chat.id,
        'Ви щойно проголосували. Для виведення результатів виконайте /poll_results',
        { reply_to_message_id: msg.message_id, disable_notification: true })
        .then(m => shouldBeDeleted.push(m.message_id));
    };
    for (let i = 1; i <= polls[index].answers.length; i++) {
      str = str.concat('/' + i + '. ' + polls[index].answers[i - 1].text + '\n');
      // poll[i].value = 0;
      // bot.onText(new RegExp(`/${i}`), f);

    }
    return str;
  };
  polls[index].opened = true;
  bot.sendMessage(msg.chat.id, `<b>${polls[index].question}</b>`,
    { reply_markup: generateButtons(polls[index]), parse_mode: 'html' })
    .then(m => shouldBeDeleted.push(m.message_id));

  bot.sendMessage(
    msg.chat.id, getAnswsString())
    .then(m => {
      polls[index].pollMessageId = m.message_id;
      shouldBeDeleted.push(m.message_id);
      // if (msg.chat.type !== 'private' && msg.chat.type !== 'group')
      //   bot.pinChatMessage(msg.chat.id, m.message_id);
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
};

bot.onText(/\/poll_start/, msg => {
  if (!polls.some(e => e.chatId === msg.chat.id))
    polls.push({ // poll object template
      chatId: msg.chat.id,
      creatorId: msg.from.id,
      question: '',
      answers: [],
      pollMessageId: null,
      opened: false
    })
  else
    bot.sendMessage(msg.chat.id, 'Закрийте попереднє голосування',
      { reply_to_message_id: msg.message_id });

  const index = polls.findIndex(val => val.creatorId === msg.from.id);

  const ask = () => {
    bot.once('text', m => {
      if (m.from.id === polls[index].creatorId) {
        if (/\/poll_done/.test(m.text)) {
          deletePollMessages(m);
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
          deletePollMessages(m);
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
