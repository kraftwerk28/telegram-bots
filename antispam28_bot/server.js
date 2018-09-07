'use strict';

const fs = require('fs');
const db = require('./lib/mongoclient');

const config = JSON.parse(fs.readFileSync('./botconfig'));
const botID = config['id'];
const bot = require('./lib/bot-poll')(config['token']);

bot.on('error', (e) => {
  console.log(e);
  process.exit(0);
});

bot.on('polling_error', (e) => {
  console.log(e);
  process.exit(0);
});

bot.on('text', (msg) => {
  // console.log('Text message:', msg);
});

bot.on('message', (msg) => {
  const newMembers = msg['new_chat_members'];
  const leftMember = msg['left_chat_member'];

  if (newMembers) {
    const meIndex = newMembers.findIndex(m => m.id === botID);
    if (meIndex >= 0) {
      db.newGroup(msg['chat']);
    }
  }
  if (leftMember) {
    if (leftMember.id === botID) {
      db.removeGroup(msg['chat']);
    }
  }
});
