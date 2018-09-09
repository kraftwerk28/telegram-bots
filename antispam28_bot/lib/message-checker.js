'use strict';

const badChecker = /(vip|вип|btc|биткоин|порно|канал)/i;

module.exports = function bad(msg) {
  return (
    msg['entities'] &&
    msg.entities.some((e) => e.type === 'text_link') &&
    badChecker.test(msg.text)
  );
}
