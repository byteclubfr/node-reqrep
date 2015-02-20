"use strict";

var options = { "queue": "sample_queue", "onJob": onJob};

var reqrep;
try {
  reqrep = require("./");
} catch (e) {
  console.log("You have to build 'lib' directory first: run `npm run prepublish`");
  console.error(e);
  process.exit(1);
}


// Workers

function onJob (data, cb) {
  var id = this._internalId;
  console.log("< REP", id, data);
  setTimeout(function () {
    var reply = {"double": data.value * 2};
    console.log("> REP", id, data, reply);
    cb(null, reply);
  }, Math.random() * 1000);
}

var worker1 = new reqrep.Reply(options);
worker1._internalId = "worker1";

var worker2 = new reqrep.Reply(options);
worker2._internalId = "worker2";


// Schedulers

var sender = new reqrep.Request(options);

for (var i = 0; i < 20; i++) {
  (function (i) {
    console.log("> REQ", i);
    sender.send({"value": i}, function (err, double) {
      console.log("< REQ", i, double);
    });
  })(i);
}
