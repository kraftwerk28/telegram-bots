const db = require('../lib/mongoclient');
const mc = require('mongodb').MongoClient;

async function testPromise() {
  console.log(
    await db.interactPromised('test', async (cl) => {
      const res = await cl.findOne({}, (d) => {
        console.log(d);
      })
      // .then(res => res);
      console.log('result: ' + res);
      return res;
      // return 'kek';
    })
  );

}

function test() {
  db.interact('test', async (collection) => {
    const res = await collection.findOne({ 'groups': { '$exists': true } })
    console.log(res);
    return res;
  });
}

function testrow() {
  mc.connect('mongodb://localhost:27017', { useNewUrlParser: true }, (err, c) => {
    c.db('admin').collection('test').findOne({ 'groups': { '$exists': true } })
      .then(d => console.log(d))
  })
}

// testPromise();
test();
// testrow();
