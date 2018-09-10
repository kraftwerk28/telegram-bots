'use strict';

const db = require('../lib/mongoclient');

(async () => {
  console.log(await db.getGroup({ id: -1001195618494 }));
})();

