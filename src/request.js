"use strict";

import uuid from "uuid";
import {Push, Pull} from "pushpull";
import {merge, remove} from "lodash";
import {EventEmitter} from "events";

export default class Request extends EventEmitter {
  constructor (options = {}) {
    var {queue} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    this._options = options;

    this._push = new Push(merge({}, options, {"queue": queue + "requests"}));
    this._push.on("error", (err) => this.emit("error", err));

    this._pendingPulls = [];
    this.on("error", () => {
      this._pendingPulls.forEach((pull) => pull.end());
    });
  }

  send (job, cb) {
    var id = uuid();

    this._push.write([id, job]);

    var pull = new Pull(merge({}, this._options, {"queue": this._options.queue + "replies:" + id}));

    this._pendingPulls.push(pull);

    var cleanup = () => {
      remove(this._pendingPulls, (p) => p === pull);
      pull.end();
    };

    pull.once("error", (err) => {
      cleanup();
      cb(err);
    });

    pull.once("data", (reply) => {
      cleanup();
      cb(null, reply);
    });
  }

  end () {
    this._push.end();
  }
}
