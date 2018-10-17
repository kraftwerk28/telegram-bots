'use strict';

const fs = require('fs');
const db = require('./lib/mongoclient');
const clk = require('chalk');

const COLLECTION_NAME = 'test';

const config = JSON.parse(fs.readFileSync('./botconfig'));
const botID = config['id'];

const messageChecker = require('./lib/message-checker');
const bot = require('./lib/bot-poll')(config['token']);
const observers = [];

const oldlog = console.log;
console.log = (...args) => {
  oldlog.call(this, '------------------------------');
  oldlog.apply(this, args);
}

const messageHandler = async (msg) => {
  // console.log(msg);
  
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    bot.sendMessage(msg.chat.id,
      'I\'m only for groups or supergroups. Write me what you want but that gives no effect :{');
    return;
  }

  const newMembers = msg['new_chat_members'];
  const leftMember = msg['left_chat_member'];

  if (newMembers) {
    const meIndex = newMembers.findIndex(m => m.id === botID);

    // bot added to group
    if (meIndex >= 0) {

      const group = msg['chat'];

      group['observeTimeout'] = config['defaultTimeout'];
      group['shouldDeleteJoins'] = true;
      group['banned'] = [];
      group['iAmAdmin'] = await bot.isAdmin(msg.chat.id);

      if (!group.iAmAdmin) {
        bot.sendMessage(msg.chat.id,
          'Promote me to admin to start banning spammers ');
      }

      await db.newGroup(group);

    }

    const group = await db.getGroup(msg.chat);
    // user joined group
    const joined = newMembers.filter((mem) => mem.id !== botID);
    let observerTimeout =
      await group['observeTimeout'];

    // start observing each user
    joined.forEach((user) => {
      const _id = observers.length <= 0 ? 0 : observers[observers.length - 1].timerId;
      const observer = {
        id: _id,
        userId: user.id,
        chatId: msg.chat.id,
      };

      observer['timerId'] = setTimeout(() => {
        const index = observers.findIndex((o) => o.id === _id); // bad code ((
        observers.splice(index, 1);
      }, observerTimeout);

      observers.push(observer);

    });

    const { shouldDeleteJoins } = group;

    if (shouldDeleteJoins) {
      bot.deleteMessage(msg.chat.id, msg.message_id);
    }

  }

  if (leftMember) {
    if (leftMember.id === botID) {
      db.removeGroup(msg.chat);
    }
  }
};

const idFromUsername = async (msg, username) =>
  await db.interact(COLLECTION_NAME, async (coll) => {
    return await coll.findOne({ 'groups': { '$exists': true } })
      .then((doc) => {
        const group = doc.groups.find((gr) => gr.id === msg.chat.id);
        if (group) {
          const user = group.banned.find(user => user.username === username);
          if (user) {
            return user.id;
          }
        }
        return null;
      })
  });

const banUser = async (msg) => {
  await db.interact(COLLECTION_NAME, async (coll) => {
    await coll.updateOne(
      { 'groups': { '$exists': true }, 'groups.id': msg.chat.id },
      {
        '$push': {
          'groups.$.banned': await bot.getChatMember(msg.chat.id, msg.from.id)
            .then((cm) => cm.user)
        }
      });
  });
  bot.kickChatMember(msg.chat.id, msg.from.id)
    .then((success) => {
      if (success) {
        // if (msg.chat.type === 'supergroup') {
        //   bot.unbanChatMember(msg.chat.id, msg.from.id)
        // }

        return true;
      }
      return false;
    })
    .then((val) => {
      if (val) {
        bot.deleteMessage(msg.chat.id, msg.message_id);
      }
    })
  // .then(() => {
  //   bot.sendMessage(msg.chat.id, msg.from['first_name'] + ' was banned');
  // });

};


// handlers

bot.on('error', (e) => {
  console.log(e);
  process.exit(0);
});

bot.on('polling_error', (e) => {
  console.log(e);
  process.exit(0);
});

bot.on('message', messageHandler);

bot.on('text', (msg) => {
  const shouldBan = messageChecker(msg);
  if (shouldBan) console.log('Should ban!');
  if (shouldBan && observers.some((o) =>
    o.userId === msg.from.id && o.chatId === msg.chat.id)) {
    banUser(msg);
  }

});


// commands

bot.onText(/\/set_observe_timeout(.*) ([0-9]+)/, (msg, match) => {
  const num = parseInt(match[2]);
  db.interact(COLLECTION_NAME, async (coll) => {
    coll.updateOne(
      { 'groups': { '$exists': true }, 'groups.id': msg.chat.id },
      { '$set': { 'groups.$.observeTimeout': num } }
    )
  });
});

bot.onText(/\/ban(.*) (\w+)/, async (msg, match) => {
  db.interact(COLLECTION_NAME, async (coll) => {
    await coll.updateOne(
      { 'groups': { '$exists': true }, 'groups.id': msg.chat.id },
      {
        '$push': {
          'groups.$.banned': await bot.getChatMember(msg.chat.id, match[2])
            .then((cm) => cm.user)
        }
      });
  });
  bot.kickChatMember(msg.chat.id, match[2]);
});

bot.onText(/\/recover(.*) @(\w+)/, async (msg, match) => {
  const userId = await idFromUsername(msg, match[2])
  bot.unbanChatMember(msg.chat.id, userId);
});

bot.onText(/\/toggle_deleting_joins/, (msg) => {
  db.interact(COLLECTION_NAME, async (coll) => {
    const { shouldDeleteJoins } = await db.getGroup(msg.chat);
    coll.updateOne({ 'groups': { '$exists': true }, 'groups.id': msg.chat.id },
      { '$set': { 'groups.$.shouldDeleteJoins': !shouldDeleteJoins } })
    return !shouldDeleteJoins;
  })
    .then((val) => {
      bot.sendMessage(msg.chat.id,
        val ? '\'User joined\' messages now will be deleted every time' :
          '\'User joined\' messages now will not be deleted');
    })
});

bot.onText(/\/get_banned/, async (msg) => {
  let banned = await db.interact(COLLECTION_NAME, async (col) =>
    await coll.findOne({ 'groups': { '$exists': true } })
      .then(obj => obj.groups.find(g => g.id === msg.chat.id).banned)
  )

  if (banned)
    banned = banned.reduce((prev, curr, i) =>
      prev +
      `${i + 1}. ${user['first_name']}${user['username'] ? (' (' + user['username'] + ')') : ''}.\n`,
      '');

  bot.sendMessage(msg.chat.id, banned ? `List of banned users:\n\n${banned}` : 'No banned users here :D');

});
