const MongoClient = require('mongodb');
const URI = 'mongodb://localhost:27017';
const DB_NAME = 'admin';//'antispam28_bot';
const COLLECTION_NAME = 'test';
const LOGGER_LEVEL = 'error';
const CONNECTION_CONFIG = {
  useNewUrlParser: true,
  loggerLevel: LOGGER_LEVEL
}

// callback shoud return Promise !!!
async function interact(collectionName, callback) {
  return await MongoClient.connect(URI, CONNECTION_CONFIG)
    .then((client) => {
      const db = client.db(DB_NAME);
      const collection = db.collection(collectionName);
      return callback(collection).then((val) => {
        client.close();
        return val;
      });
    })
    .catch((reason) => {
      throw reason;
    });
};

async function newGroup(chat) {
  await interact(COLLECTION_NAME, async (collection) => {
    await collection.updateOne(
      { 'groups': { '$exists': true } },
      {
        '$push': { 'groups': chat }
      });
  });
};

async function removeGroup(chat) {
  await interact(COLLECTION_NAME, async (collection) => {
    await collection.updateOne(
      { 'groups': { '$exists': true } },
      {
        '$pull': { 'groups': { 'id': chat['id'] } }
      });
  });
};

async function getGroup(chat) {
  return await interact(COLLECTION_NAME, async (coll) =>
    await coll.findOne({ 'groups': { '$exists': true } })
      .then(g => g['groups'].find(g => g.id === chat.id)));
}

module.exports = {
  interact,
  newGroup, removeGroup, getGroup,
}
