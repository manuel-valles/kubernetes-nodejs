const path = require('path');
const { MongoClient } = require('mongodb');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/dev';
const client = new MongoClient(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const { dbName } = client.s.options;

const initMongo = async () => {
  console.log('Initialising MongoDB...');
  try {
    await client.connect();
    const database = client.db(dbName);
    database.collection('notes');
  } catch (error) {
    console.log('Error connecting to MongoDB, retrying in 1 second');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initMongo();
  } finally {
    await client.close();
  }
};

const start = async () => {
  const db = await initMongo();

  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
  });

  app.get('/', async (req, res) => res.render('index', { notes: [] }));
};

start();
