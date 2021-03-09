"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _config = require("./config");

var _fs = _interopRequireDefault(require("fs"));

var _numeral = _interopRequireDefault(require("numeral"));

var _discord = _interopRequireWildcard(require("discord.js"));

var _yahooFinance = _interopRequireDefault(require("yahoo-finance"));

var _log4js = _interopRequireDefault(require("log4js"));

//config imports
//util
//api
//logging
_log4js["default"].configure({
  appenders: {
    alerts: {
      type: "file",
      filename: "logs/alerts.log"
    },
    errorFile: {
      type: "file",
      filename: "logs/errors.log"
    },
    errors: {
      type: "logLevelFilter",
      level: "ERROR",
      appender: "errorFile"
    }
  },
  categories: {
    "default": {
      appenders: ["alerts", "errors"],
      level: "DEBUG"
    }
  }
});

var logger = _log4js["default"].getLogger("alerts");

var discord_client = new _discord["default"].Client();
var refreshTime = 1000;
var prefix = "!";
/*
  setinterval - to loop through prices in alert list 
  if price hits target then 
  
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
                _context.next = 18;
                break;
              }

              alert = alerts_data.alerts[i];
              symbol = alert.symbol;
              start = alert.start;
              target = alert.target;

              if (start.constructor == Array) {
                start = start[0].raw;
              }

              if (target.constructor == Array) {
                target = target[0].raw;
              }

              _context.next = 13;
              return _yahooFinance["default"].quote({
                symbol: symbol,
                modules: ["price"] // optional; default modules.

              });

            case 13:
              quote = _context.sent;

              /*
               if the target is more than the start, it means that only if the price rises to target or above will it trigger
               if the target is less than the start, it means that only if hte price lowers to target or lower it will tigger 
               */
              if ((target >= start && quote.price.regularMarketPrice >= target || target <= start && quote.price.regularMarketPrice <= target) && !isNaN(quote.price.regularMarketPrice)) {
                channel_id = alert.channel_id;
                username = alert.username;
                logger.debug("TARGET HIT! Target: " + target + "; Start: " + start + "; Quote: " + quote.price.regularMarketPrice);
                embed = new _discord["default"].MessageEmbed().setColor("#16a085").setTitle("$" + symbol + " Price Alert REACHED").setDescription("PRICE HAS REACHED TARGET!").setAuthor("@" + username).addFields({
                  name: "Alert Target Price",
                  value: (0, _numeral["default"])(target).format("$0,0.00")
                }, {
                  name: "Current Price",
                  value: (0, _numeral["default"])(start).format("$0,0.00")
                }).setTimestamp();
                discord_client.channels.cache.get(channel_id).send(embed);
                alertsForRemoval.push(i);
              }

            case 15:
              i++;
              _context.next = 4;
              break;

            case 18:
              if (alertsForRemoval.length > 0) {
                for (_i = 0; _i < alertsForRemoval.length; _i++) {
                  e = alertsForRemoval[_i];
                  alerts_data.alerts.splice(e, 1);
                }

                updatedData = JSON.stringify(alerts_data, null, 2);

                _fs["default"].writeFile("alerts.json", updatedData, function (err) {
                  if (err) {
                    logger.error(err);
                  }

                  logger.debug("Alerts Removed");
                });
              } //discord_client.channels.cache.get('818295613434888192').send('hello there!');
              //message.channel.send(alerts);


            case 19:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })), 1000);
  } catch (error) {
    logger.error(err);
  }
}
/*
  !stockalert symbol target
  ex:
  !stockalert AAPL 150
*/


function saveAlert(user_id, username, symbol, start, target, timestamp, channel_id) {
  var rawdata = _fs["default"].readFileSync("alerts.json");

  var alerts_data = JSON.parse(rawdata);

  if (start === undefined) {
    throw new Error("Stock symbol doesn't exist");
  } else {
    alerts_data.alerts.push({
      user_id: user_id,
      username: username,
      channel_id: channel_id,
      symbol: symbol,
      start: start,
      target: target,
      timestamp: timestamp
    });
    logger.debug("ALERT ADDED! user_id:" + user_id + ", username:" + username + ", channel_id:" + channel_id + ", symbol:" + symbol + ", start:" + start + ", target:" + target + ", timestamp:" + timestamp);
    var updatedData = JSON.stringify(alerts_data, null, 2);

    _fs["default"].writeFile("alerts.json", updatedData, function (err) {
      if (err) {
        logger.error(err);
      }

      var embed = new _discord["default"].MessageEmbed().setColor("#16a085").setTitle("$" + symbol + " Price Alert Set").setDescription("When price has been reached, the bot will reply with a message on this channel.").setAuthor("@" + username).addFields({
        name: "Alert Target Price",
        value: (0, _numeral["default"])(target).format("$0,0.00")
      }, {
        name: "Current Price",
        value: (0, _numeral["default"])(start).format("$0,0.00")
      }).setTimestamp();
      discord_client.channels.cache.get(channel_id).send(embed);
    });
  }
}

function deleteAlert(user_id, username, alert_id, channel_id) {
  var rawdata = _fs["default"].readFileSync("alerts.json");

  var alerts_data = JSON.parse(rawdata);
  console.log(alert_id);

  if (alerts_data.alerts[alert_id].user_id === user_id) {
    alerts_data.alerts.splice(alert_id, 1);
    var updatedData = JSON.stringify(alerts_data, null, 2);

    _fs["default"].writeFile("alerts.json", updatedData, function (err) {
      if (err) {
        throw new Error("Alert doesn't exists to be removed.  Please check ID in list.");
        logger.error(err);
      }
    });

    discord_client.channels.cache.get(channel_id).send("Alert Removed");
  } else {
    throw new Error("Alert doesn't exists.  Please check ID in list.");
  }
}

function viewAlert(user_id, username, channel_id) {
  var rawdata = _fs["default"].readFileSync("alerts.json");

  var alerts_data = JSON.parse(rawdata);
  var embed = new _discord["default"].MessageEmbed().setColor("#16a085").setTitle("@" + username + "'s Alert List");

  for (var i = 0; i < alerts_data.alerts.length; i++) {
    var alert = alerts_data.alerts[i];

    if (alert.user_id === user_id) {
      embed.addFields({
        name: "ID",
        value: i,
        inline: true
      }, {
        name: "Symbol",
        value: alert.symbol,
        inline: true
      }, {
        name: "Alert Target Price",
        value: (0, _numeral["default"])(alert.target).format("$0,0.00"),
        inline: true
      });
    }
  }

  discord_client.channels.cache.get(channel_id).send(embed);
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
    var args, command, alert_id, quotes;
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
              _context3.next = 36;
              break;
            }

            if (args.length) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt("return", message.channel.send("You didn't provide any arguments, ".concat(message.author, "! \n\n") + "Commands:\n" + "!stockAlert [SYMBOL] [TARGETPRICE] ex: !stockAlert GME 1200.25\n" + "!stockAlert view \n" + "!stockAlert delete [ID] ex: !stockAlert delete 3 \n"));

          case 7:
            if (!(args[0].toLowerCase() === "view")) {
              _context3.next = 11;
              break;
            }

            viewAlert(message.member.user.id, message.member.user.username, message.channel.id);
            _context3.next = 36;
            break;

          case 11:
            if (!(args[0] === "delete")) {
              _context3.next = 24;
              break;
            }

            alert_id = args[1];
            _context3.prev = 13;
            _context3.next = 16;
            return deleteAlert(message.member.user.id, message.member.user.username, alert_id, message.channel.id);

          case 16:
            _context3.next = 22;
            break;

          case 18:
            _context3.prev = 18;
            _context3.t0 = _context3["catch"](13);
            message.channel.send("Error: " + _context3.t0);
            logger.error(_context3.t0);

          case 22:
            _context3.next = 36;
            break;

          case 24:
            _context3.next = 26;
            return _yahooFinance["default"].quote({
              symbol: args[0],
              modules: ["price", "summaryDetail", "summaryProfile"]
            });

          case 26:
            quotes = _context3.sent;
            _context3.prev = 27;
            _context3.next = 30;
            return saveAlert(message.member.user.id, message.member.user.username, args[0], quotes.price.regularMarketPrice, args[1], message.createdAt, message.channel.id);

          case 30:
            _context3.next = 36;
            break;

          case 32:
            _context3.prev = 32;
            _context3.t1 = _context3["catch"](27);
            message.channel.send("Error: " + _context3.t1);
            logger.error(_context3.t1);

          case 36:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[13, 18], [27, 32]]);
  }));

  return function (_x2) {
    return _ref3.apply(this, arguments);
  };
}());
discord_client.login(_config.alert_key);