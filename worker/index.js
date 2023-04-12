// all the keys we need for connecting to redis will be stored in a separate
// file. So first thing we need is to rquire in that file. it has the host name
//  and port required to connect to redis
const keys = require('./keys')
const redis = require('redis') // imports a redis clients

// create a redis client
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000 // tells the redis client to attempt to reconnect to the server once every 1000ms if it loses connection to the server
});

// duplicate the redics client
const sub =  redisClient.duplicate();

// deliberately using recursive solution to fib problem to justify the worker
// process (because recursive solution is slow)
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// watch redis for new value, any time we see one, run fib function on it
sub.on('message', (channel, message) => {
  redisClient.hset('values', message, fib(parseInt(message)));
});
sub.subscribe('insert');
