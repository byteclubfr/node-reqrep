"use strict";

import uuid from "uuid";
import {Push, Pull} from "pushpull";
import {merge} from "lodash";
import {EventEmitter} from "events";

export default class Request extends EventEmitter {
  constructor (options = {}) {
    var {queue, onJob} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    if (!onJob) {
      throw new Error("Mandatory option 'onJob' not set");
    }

    this._options = options;

    this._push = new Push(merge({}, options, {"queue": options.queue + "replies:UNDEF"}));
    this._push.on("error", (err) => this.emit("error", err));

    this._pull = new Pull(merge({}, options, {"queue": queue + "requests"}));
    this._pull.on("error", (err) => this.emit("error", err));

    this._pull.on("data", (job) => {
      var [id, data] = job;
      onJob.call(this, data, (err, result) => {
        if (err) {
          return this.emit("error", err);
        }

        this._push._queue = options.queue + "replies:" + id;
        this._push.write(result);
      });
    });
  }

  end () {
    this._push.end();
    this._pull.end();
  }
}
