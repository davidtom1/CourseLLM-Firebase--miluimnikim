"use strict";
/**
 * Firebase Cloud Functions entry point.
 *
 * This file exports all callable Cloud Functions for the Firebase Emulator and production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMessage = void 0;
const firebase_functions_1 = require("firebase-functions");
// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
(0, firebase_functions_1.setGlobalOptions)({ maxInstances: 10 });
var analyzeMessage_1 = require("./analyzeMessage");
Object.defineProperty(exports, "analyzeMessage", { enumerable: true, get: function () { return analyzeMessage_1.analyzeMessage; } });
//# sourceMappingURL=index.js.map