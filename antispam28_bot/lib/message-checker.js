'use strict';

const badChecker = /(vip|вип|btc|bitcoin|биткоин|porn|pron|п(ро|ор)н|cp|канал|gastro|гастро|лс|переза[їе]зд)/i;
const badUrls = [
  /t\.me\//,
  /instagram\.com\//,
  /facebook\.com\//,
  /telegram.me/,
  /joinchat/
]

module.exports = function bad(msg) {
  return (
    msg['entities'] &&
    (
      msg.entities.some((e) =>
        e.type === 'text_link' ||
        e.type === 'mention') ||
      msg.entities.some((e) =>
        e.type === 'url' &&
        badUrls.some(u => u.test(msg.text))
      )
    ) ||
    badChecker.test(msg.text)
  );
}
