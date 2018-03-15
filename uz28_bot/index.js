'use strict';

const https = require('https');
const request = require('request');
const querystring = require('querystring');
const express = require('express');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = fs.readFileSync('./token', 'utf8');
const bot = new TelegramBot(TOKEN, {
  polling: true
});

// 2208390 Znam
// 2200001 Kyiv

const URL = 'https://booking.uz.gov.ua/';

const tr_search = 'train_search/';
const station = 'station/'

let response = {};
let from = 0;
let to = 0

let listlength = 0;
/*
setInterval(() => {
  request.post('https://booking.uz.gov.ua/train_search/', {
      form: {
        from: 2208390,
        to: 2200001,
        date: '2018-03-11',
        time: '00:00'
      }
    },
    (err, res, body) => {
      const result = JSON.parse(body);
      if (listlength !== result.data.list.length)
        bot.sendMessage(343097987, 'Список змінився');
      listlength = result.data.list.length;
    }
  )
}, 1000 * 60 * 2);
*/
request.post('https://booking.uz.gov.ua/train_search/', {
      form: {
        from: 2208390,
        to: 2200001,
        date: '2018-03-11',
        time: '00:00'
      }
    },
    (err, res, body) => {
      const result = JSON.parse(body);
      fs.writeFileSync('res.json', body);
      listlength = result.data.list.length;
      console.log(result.data.list.length);
    }
  )
/*
request.get(`https://booking.uz.gov.ua/train_search/station/?${querystring.stringify({term: 'Луганськ'})}`,

  (err, res, body) => {
    console.log(JSON.parse(body)[0]);
    from = JSON.parse(body)[0].value;

    request.get(`https://booking.uz.gov.ua/train_search/station/?${querystring.stringify({term: 'Знам\'янка-Пас.'})}`,
      (err, res, body) => {
        console.log(JSON.parse(body));
        to = JSON.parse(body)[0].value;
        request.post('https://booking.uz.gov.ua/train_search/', {
            form: {
              from: from,
              to: to,
              date: '2018-02-24',
              time: '00:00'
            }
          },
          (err, res, body) => {
            fs.writeFileSync('./res.json', body);
          }
        );
      });
  });
*/