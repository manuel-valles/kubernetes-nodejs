const path = require('path');
const express = require('express');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const marked = require('marked');

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
  } catch (error) {
    console.log('Error connecting to MongoDB, retrying in 1 second');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initMongo();
  }
  return client.db(dbName).collection('notes');
};

const retrieveNotes = async (db) =>
  (await db.find().toArray()).reverse().map((note) => ({
    ...note,
    description: marked(note.description),
  }));

const saveNote = async (db, note) => db.insertOne(note);

const start = async () => {
  const db = await initMongo();

  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
  });

  app.get('/', async (req, res) =>
    res.render('index', { notes: await retrieveNotes(db) })
  );

  // The name 'image' must match with the name of the file in 'index.pug': <type="file" name="image">
  app.post(
    '/note',
    multer({ dest: path.join(__dirname, 'public/uploads/') }).single('image'),
    async (req, res) => {
      if (!req.body.upload && req.body.description) {
        await saveNote(db, { description: req.body.description });
        res.redirect('/');
      } else if (req.body.upload && req.file) {
        const link = `/uploads/${encodeURIComponent(req.file.filename)}`;
        res.render('index', {
          content: `${req.body.description} ![${req.file.originalname}](${link})`,
          notes: await retrieveNotes(db),
        });
      }
    }
  );
};

start();
