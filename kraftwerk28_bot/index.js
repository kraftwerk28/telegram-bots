'use strict';

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const NodeWebcam = require('node-webcam');

const bot = new TelegramBot('414704813:AAGDLcBceKFXcXRD_3T9LGPEBNiQwc9QG6M', { polling: true });

const webcamOpts = {
  //Picture related 
  width: 1280,
  height: 720,
  quality: 100,
  //Delay to take shot 
  delay: 0,
  //Save shots in memory 
  saveShots: true,
  // [jpeg, png] support varies 
  // Webcam.OutputTypes 
  output: "jpeg",
  //Which camera to use 
  //Use Webcam.list() for results 
  //false for default device 
  device: true,
  // [location, buffer, base64] 
  // Webcam.CallbackReturnTypes 
  callbackReturn: "location",
  //Logging 
  verbose: true
};

// const Webcam = NodeWebcam.create(webcamOpts);

let id;
let isFlooding = false;
let flooder;

// flood script
bot.onText(/\/flood@kraftwerk_bot(.*)/, (msg, match) => {
  if (!isFlooding) {
    // console.log(match);
    if (match[1] === '') {
      bot.sendMessage(id, 'Допишіть слово для флуду');
    } else {
      isFlooding = true;
      let m = match[1];
      id = msg.chat.id;
      bot.sendMessage(id, 'Починаю флудити...');
      flooder = setInterval(() => {
        bot.sendMessage(id, m);
      }, 5000);
    }
  }
});

bot.onText(/\/unflood@kraftwerk_bot/, (msg, match) => {
  isFlooding = false;
  id = msg.chat.id;
  bot.sendMessage(id, 'Ок)');
  clearInterval(flooder);
});


bot.on('message', (msg) => {
  // const id = msg.chat.id;
  // const from = msg.from; 
  console.dir(msg);
  // bot.sendMessage(id, `<code>${msg}</code>`, { parse_mode: 'html' });
});

bot.onText(/\/snap/, (msg, match) => {
  id = msg.chat.id;
  NodeWebcam.capture('face', webcamOpts, (err, data) => {
    // console.log(data);
    if (err)
      throw err;
    else
      bot.sendPhoto(id, data);
  });
});


