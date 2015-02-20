[![Build Status](https://img.shields.io/travis/lmtm/node-reqrep/master.svg?style=flat)](https://travis-ci.org/lmtm/node-reqrep)
[![Dependency Status](https://david-dm.org/lmtm/node-reqrep.svg?style=flat)](https://david-dm.org/lmtm/node-reqrep)
[![devDependency Status](https://david-dm.org/lmtm/node-reqrep/dev-status.svg?style=flat)](https://david-dm.org/lmtm/node-reqrep#info=devDependencies)

Request/Reply
=============

Implement the Request/Reply pattern using Redis as backend. This pattern is typically used to handle pool of workers which we expect a result from.

If you don't care about the result from the worker, then take a look at [pushpull](https://github.com/lmtm/node-pushpull).

Installation
------------

```sh
npm install --save reqrep
```

You may want to install `hiredis` to, whenever possible:

```sh
npm install --save-optional hiredis
```

Usage
-----

Look at (and run) [`sample.js`](./sample.js) for a working example.

```js
// Workers

function onJob (data, cb) {
  // Received job's data
  console.log("Received job", this._internalId);
  // Send result:
  cb(null, 42);
}

var worker1 = new Reply(options);
worker1._internalId = "worker1";

var worker2 = new Reply(options);
worker2._internalId = "worker2";


// Schedulers

var sender = new Request(options);

for (var i = 0; i < 20; i++) {
  sender.send({"someData": i}, function (err, reply) {
    // …
  });
}
```

Request API
-----------

* **`new Request(options)`**: constructor, see *Options* below
* **`send(data, onReply, onPushed)`**: send a new job, you can provide two optional callbacks:
  * `onReply(err, reply)` is called whenever a worker has replied
  * `onPushed(err, data)` is called as soon as the job has been properly pushed
* **`error` event**: emitter when an error occurs (seriously)
* **`end()`**: close the underlying clients

Reply API
---------

* **`new Request(options)`**: constructor, see *Options* below
* **`error` event**: emitter when an error occurs (seriously)
* **`end()`**: close the underlying clients

You will note there is no "job" or "data" event. When a job is received, `options.onJob` is called with following arguments:

* Job's data
* A callback you're supposed to called once result is available: `callback(err, result)`
* The job internal ID (for debugging or logging purpose)

Options
-------

`Request` and `Reply` take any valid option from [pushpull](https://github.com/lmtm/node-pushpull).

* **`queue`** is **not** the real Redis key name, but only a prefix
  * Note: generated keys are `{queue}replies:*` and `{queue}requests`
* **`onJob`** (mandatory) is called when a job is received by a `Reply` instance
  * Format: `onJob(data, callback(err, result), id)`

TODO
----

* Current implementation is suboptimal, a new connection to Redis is open each time a job is sent. This has to be fixed before real production usage.
