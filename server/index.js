// This file has the logic we need to connect to redis, postgress and
// communicate with running React app
const keys = require('./keys');

// Express API setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// create a new express app, it is the object that is going to receive and
// repond to any HTTP requests that are going or coming back from the React
// application
const app = express();
// Next we wire up "cors" - Cross Origin Resource Sharing. Allows us to make
// requests from one domain that the react app is running on to the port that
// the express API is hosted on
app.use(cors());
// parse incoming requests from the React appliction and turn the body of the
// post request into a json value that our express API can work with.
app.use(bodyParser.json());


// Postgress client setup
// allows express app to communicate with running psotgres server
const{ Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

// Redis client setup
// Connect to redis instance from express server
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
// we make duplicate connections to redisClient in both index.js files because
// according to redis documentation for this js library if we ever have a client
// listening/publishing information on redis we have to make a duplicate
// connection since it cannot be used for other purposes.
const redisPublisher = redisClient.duplicate();

// Express route handlers

// any time a request is made to the root '/' route of our express application
// send back a yagga yow respoonse
app.get('/', (req, res) => {
  res.send('Yagga YOW!');
});

// return all the indices ever submitted to postgress
app.get('/values/all', async (req, res) => {
  const values  = await pgClient.query('SELECT * FROM values');
  res.send(values.rows);
});

// From redis etreive all the different indices that have ever been requested by
// users and return teh calcualted values
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

// receive new values from the React app
app.post('/values', async (req, res) => {
  const index = req.body.index;
  // don't calcaute fib values higher than the 40th index cos it takes too long
  if (parseInt(index) > 40){
    return res.status(422).send('Index too high');
  }
  // put the value in the redis datastore
  redisClient.hset('values', index, 'Nothing yet!');
  // Publish a new insert event of that index, wakes up the worker process to
  // pull out a new value from redis and work out fib for it
  redisPublisher.publish('insert', index);
  // Add in new index that was submitted to postgres
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({working: true});
});

app.listen(5000, err => {
  console.log('Listening');
});
