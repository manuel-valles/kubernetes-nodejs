const path = require('path');
const { MongoClient } = require('mongodb');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/dev';

const initMongo = async () => {
  console.log('Initialising MongoDB...');
  return MongoClient.connect(
    mongoURL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    (err, client) => {
      if (err) {
        console.log('Error connecting to MongoDB, retrying in 1 second');
        return setTimeout(() => initMongo(), 1000);
      }
      console.log('MongoDB initialised');
      return client.db(client.s.options.dbName).collection('notes');
    }
  );
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
