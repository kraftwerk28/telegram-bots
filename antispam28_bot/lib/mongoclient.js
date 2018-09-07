const MongoClient = require('mongodb');
const URI = 'mongodb://localhost:27017';
const dbName = 'admin';//'antispam28_bot';


function interact(collectionName, callback) {
  MongoClient.connect(URI, { useNewUrlParser: true }, (err, client) => {
    if (err)
      throw err;

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    callback(collection);
  });
};

const newGroup = (chat) => {
  interact('test', (collection) => {
    collection.updateOne(
      { 'groups': { '$exists': true } },
      {
        '$push': { 'groups': chat }
      });
  });
};

const removeGroup = (chat) => {
  interact('test', (collection) => {
    collection.updateOne(
      { 'groups': { '$exists': true } },
      {
        '$pull': { 'groups': { 'id': chat['id'] } }
      }
    );
  })
};

module.exports = {
  newGroup, removeGroup,
}
