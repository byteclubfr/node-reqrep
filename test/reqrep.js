"use strict";

import {Request, Reply} from "../src/reqrep";
import expect from "expect";
import {uniq, pluck} from "lodash";

describe("Request/Reply", () => {

  var queue = "_test_queue_";
  var req, rep1, rep2;

  after((done) => req._push._redisClient.keys(queue + "*", (err, keys) => {
    if (err) {
      return done(err);
    }
    if (!keys.length) {
      return done();
    }
    req._push._redisClient.del(keys, done)
  }));

  after(() => req && req.end());
  after(() => rep1 && rep1.end());
  after(() => rep2 && rep2.end());

  var gotJobs = [];
  function onRequest (data, cb) {
    gotJobs.push(data);
    cb(null, [this.index, data]);
  }

  var gotReplies = [];
  function onReply (err, data) {
    if (err) {
      throw err;
    }
    gotReplies.push(data);
  }

  it("should create a 'requester'", () => {
    req = new Request({"queue": queue});
    expect(req).toBeAn(Object);
  });

  it("should request job 1", () => {
    req.send("job 1", onReply);
  });

  it("should request job 2 (waiting for push)", (done) => {
    req.send("job 2", onReply, done);
  });

  it("should start a worker", () => {
    rep1 = new Reply({"queue": queue, "onJob": onRequest});
    rep1.index = 1;
    expect(rep1).toBeAn(Object);
  });

  it("should have worked on jobs 1 and 2 (sent before born)", (done) => {
    (function loop () {
      try {
        expect(gotJobs).toEqual(["job 1", "job 2"]);
      } catch (e) {
        return setImmediate(loop);
      }
      done();
    })();
  });

  it("should request job 3", (done) => {
    req.send("job 3", onReply, done);
  });

  it("should work on job 3 (sent after born)", (done) => {
    (function loop () {
      try {
        expect(gotJobs).toEqual(["job 1", "job 2", "job 3"]);
      } catch (e) {
        return setImmediate(loop);
      }
      done();
    })();
  });

  it("should start another worker", () => {;
    rep2 = new Reply({"queue": queue, "onJob": onRequest});
    rep2.index = 2;
    expect(rep2).toBeAn(Object);
  });

  it("should request 4 jobs", () => {
    req.send("job 4", onReply);
    req.send("job 5", onReply);
    req.send("job 6", onReply);
    req.send("job 7", onReply);
  });

  it("should have received 7 responses", (done) => {
    (function loop () {
      try {
        expect(gotReplies.length).toEqual(7);
      } catch (e) {
        return setImmediate(loop);
      }
      done();
    })();
  });

  it("should dispatch jobs to different workers", () => {
    var ids = uniq(pluck(gotReplies, 0));
    expect(ids.length).toEqual(2);
  });

});
