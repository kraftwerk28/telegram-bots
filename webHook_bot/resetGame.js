'use strict';

const fs = require('fs');

const userListsDir = 'dickGame/';

const files = fs.readdirSync(userListsDir);
files.forEach(val => {
  if (val.charAt(0) !== '.') {
    const data = fs.readFileSync(userListsDir + val, { encoding: 'utf8' });
    const t = JSON.parse(data);
    t.forEach(e => e.played = false);
    fs.writeFileSync(userListsDir + val, JSON.stringify(t));
  }
});