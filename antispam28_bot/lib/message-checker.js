'use strict';

const badChecker = /(vip|вип|btc|bitcoin|биткоин|porn|pron|порно|cp|канал|gastro)/i;
const badUrls = [
  /t\.me\//,
  /instagram\.com\//,
  /facebook\.com\//
]

module.exports = function bad(msg) {
  return (
    msg['entities'] &&
    (
      msg.entities.some((e) => e.type === 'text_link') ||
      msg.entities.some((e) =>
        e.type === 'url' &&
        badUrls.some(u => u.test(msg.text))
      )
    ) &&
    badChecker.test(msg.text)
  );
}
