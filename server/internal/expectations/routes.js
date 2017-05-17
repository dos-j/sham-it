const hasBeenCalledHandler = require("./hasBeenCalled");
const notHasBeenCalledHandler = require("./notHasBeenCalled");
const hasBeenCalledTimesHandler = require("./hasBeenCalledTimes");
const notHasBeenCalledTimesHandler = require("./notHasBeenCalledTimes");
const hasBeenCalledWithHandler = require("./hasBeenCalledWith");
const notHasBeenCalledWithHandler = require("./notHasBeenCalledWith");
const hasBeenLastCalledWithHandler = require("./hasBeenLastCalledWith");
const notHasBeenLastCalledWithHandler = require("./notHasBeenLastCalledWith");

module.exports = ({ internalRoute, requestStore }) => [
  internalRoute(
    "POST",
    /^\/\$hasbeencalled$/,
    hasBeenCalledHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$not\/hasbeencalled$/,
    notHasBeenCalledHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$hasbeencalledtimes$/,
    hasBeenCalledTimesHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$not\/hasbeencalledtimes$/,
    notHasBeenCalledTimesHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$hasbeencalledwith$/,
    hasBeenCalledWithHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$not\/hasbeencalledwith$/,
    notHasBeenCalledWithHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$hasbeenlastcalledwith$/,
    hasBeenLastCalledWithHandler(requestStore)
  ),
  internalRoute(
    "POST",
    /^\/\$not\/hasbeenlastcalledwith$/,
    notHasBeenLastCalledWithHandler(requestStore)
  )
];
