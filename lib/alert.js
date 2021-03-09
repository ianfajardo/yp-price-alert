"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _config = require("./config");

var _discord = _interopRequireWildcard(require("discord.js"));

var _yahooFinance = _interopRequireDefault(require("yahoo-finance"));

var _numeral = _interopRequireDefault(require("numeral"));

var _fs = _interopRequireDefault(require("fs"));

/* psuedocode
  


*/
var discord_client = new _discord["default"].Client();
var refreshTime = 1000;
var prefix = "!";
/*
  setinterval - check quote's in lists
  loop alerts, if alert price
*/

function priceChecker(message) {
  try {
    setInterval( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
      var rawdata, alerts_data, alertsForRemoval, i, alert, symbol, start, target, quote, channel_id, username, embed, _i, e, updatedData;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              rawdata = _fs["default"].readFileSync("alerts.json");
              alerts_data = JSON.parse(rawdata);
              alertsForRemoval = [];
              i = 0;

            case 4:
              if (!(i < alerts_data.alerts.length)) {
                _context.next = 16;
                break;
              }

              alert = alerts_data.alerts[i];
              symbol = alert.symbol;
              start = alert.start;
              target = alert.target;
              _context.next = 11;
              return _yahooFinance["default"].quote({
                symbol: symbol,
                modules: ["price"] // optional; default modules.

              });

            case 11:
              quote = _context.sent;

              //if if the target is more than the start, it means that only if the price rises to target or above will it trigger
              //if the target is less than the start, it means that only if hte price lowers to target or lower it will tigger
              if (target >= start && quote.price.regularMarketPrice >= target || target <= start && quote.price.regularMarketPrice <= target) {
                channel_id = alert.channel_id;
                username = alert.username;
                embed = new _discord["default"].MessageEmbed().setColor("#16a085").setTitle("$" + symbol + " Price Alert REACHED").setDescription("PRICE HAS REACHED TARGET!").setAuthor("@" + username).addFields({
                  name: "Alert Target Price",
                  value: target
                }, {
                  name: "Current Price",
                  value: start
                }).setTimestamp();
                discord_client.channels.cache.get(channel_id).send(embed);
                alertsForRemoval.push(i);
              }

            case 13:
              i++;
              _context.next = 4;
              break;

            case 16:
              if (alertsForRemoval.length > 0) {
                for (_i = 0; _i < alertsForRemoval.length; _i++) {
                  e = alertsForRemoval[_i];
                  alerts_data.alerts.splice(e, 1);
                }

                updatedData = JSON.stringify(alerts_data, null, 2);

                _fs["default"].writeFile("alerts.json", updatedData, function (err) {
                  if (err) throw err;
                  console.log("alerts removed");
                });
              } //discord_client.channels.cache.get('818295613434888192').send('hello there!');
              //message.channel.send(alerts);


            case 17:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })), 1000);
  } catch (error) {
    console.log("error");
  }
}
/*
  read data
  find id for users in list
  see if symbol is in the alerts array, if not create new object
  save target, current price, channel_id and timestamp
  write data
  send user confirmation and instructions

  !stockalert symbol target
  ex:
  !stockalert AAPL 150
*/


function saveAlert(user_id, username, symbol, start, target, timestamp, channel_id) {
  var rawdata = _fs["default"].readFileSync("alerts.json");

  var alerts_data = JSON.parse(rawdata);
  alerts_data.alerts.push({
    user_id: user_id,
    username: username,
    channel_id: channel_id,
    symbol: symbol,
    start: start,
    target: target,
    timestamp: timestamp
  });
  var updatedData = JSON.stringify(alerts_data, null, 2);

  _fs["default"].writeFile("alerts.json", updatedData, function (err) {
    if (err) throw err;
    var embed = new _discord["default"].MessageEmbed().setColor("#16a085").setTitle("$" + symbol + " Price Alert Set").setDescription("When price has been reached, the bot will reply with a message on this channel.").setAuthor("@" + username).addFields({
      name: "Alert Target Price",
      value: target
    }, {
      name: "Current Price",
      value: start
    }).setTimestamp();
    discord_client.channels.cache.get(channel_id).send(embed);
  });
}

discord_client.once("ready", /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(message) {
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            //once bot is ready start the loop only once to keep checking the price alerts file for matches
            priceChecker(message);

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x) {
    return _ref2.apply(this, arguments);
  };
}());
discord_client.on("message", /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(message) {
    var args, command, quotes;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(!message.content.startsWith(prefix) || message.author.bot)) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return");

          case 2:
            args = message.content.slice(prefix.length).trim().split(" ");
            command = args.shift().toLowerCase();

            if (!(command === "stockalert")) {
              _context3.next = 18;
              break;
            }

            if (args.length) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt("return", message.channel.send("You didn't provide any arguments, ".concat(message.author, "!")));

          case 7:
            _context3.next = 9;
            return _yahooFinance["default"].quote({
              symbol: args[0],
              modules: ["price", "summaryDetail", "summaryProfile"] // optional; default modules.

            });

          case 9:
            quotes = _context3.sent;
            _context3.prev = 10;
            _context3.next = 13;
            return saveAlert(message.member.user.id, message.member.user.username, args[0], quotes.price.regularMarketPrice, args[1], message.createdAt, message.channel.id);

          case 13:
            _context3.next = 18;
            break;

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3["catch"](10);
            message.channel.send("Error: " + _context3.t0);

          case 18:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[10, 15]]);
  }));

  return function (_x2) {
    return _ref3.apply(this, arguments);
  };
}());
discord_client.login(_config.alert_key);