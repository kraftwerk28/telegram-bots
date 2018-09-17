'use strict';

const badChecker = /(vip|вип|btc|bitcoin|биткоин|порно|cp|канал|gastro)/i;

module.exports = function bad(msg) {
  return (
    msg['entities'] &&
    (
      msg.entities.some((e) => e.type === 'text_link') ||
      msg.entities.some((e) => e.type === 'url' &&
        /t\.me\//.test(msg.text))
    ) &&
    badChecker.test(msg.text)
  );
}
