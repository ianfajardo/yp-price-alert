"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _config = require("./config");

var _discord = _interopRequireWildcard(require("discord.js"));

var _yahooFinance = _interopRequireDefault(require("yahoo-finance"));

var _numeral = _interopRequireDefault(require("numeral"));

var discord_client = new _discord["default"].Client();
var prefix = "!";
discord_client.once("ready", function () {
  console.log("Bot started");
});
discord_client.on("message", /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(message) {
    var args, command, quotes, exampleEmbed;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!message.content.startsWith(prefix) || message.author.bot)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return");

          case 2:
            args = message.content.slice(prefix.length).trim().split(" ");
            command = args.shift().toLowerCase();

            if (!(command === "stockprice")) {
              _context.next = 21;
              break;
            }

            if (args.length) {
              _context.next = 7;
              break;
            }

            return _context.abrupt("return", message.channel.send("You didn't provide any arguments, ".concat(message.author, "!")));

          case 7:
            _context.next = 9;
            return _yahooFinance["default"].quote({
              symbol: args[0],
              modules: ["price", "summaryDetail", "summaryProfile"] // optional; default modules.

            });

          case 9:
            quotes = _context.sent;
            _context.prev = 10;
            _context.next = 13;
            return new _discord["default"].MessageEmbed().setColor("#0099ff").setTitle("$" + quotes.price.symbol).setDescription(quotes.price.longName).addFields({
              name: "Website",
              value: quotes.summaryProfile.website
            }).addFields({
              name: "Price",
              value: (0, _numeral["default"])(quotes.price.regularMarketPrice).format("$0,0.00")
            }, {
              name: "Today's Change",
              value: "(" + (0, _numeral["default"])(quotes.price.regularMarketChange).format("$0,0.00") + ") " + (0, _numeral["default"])(quotes.price.regularMarketChangePercent).format("0.00%"),
              inline: true
            }, {
              name: "High Today",
              value: (0, _numeral["default"])(quotes.price.regularMarketDayHigh).format("$0,0.00"),
              inline: true
            }, {
              name: "Low Today",
              value: (0, _numeral["default"])(quotes.price.regularMarketDayLow).format("$0,0.00"),
              inline: true
            }, {
              name: "Volume",
              value: (0, _numeral["default"])(quotes.price.regularMarketVolume).format("0.00a"),
              inline: true
            }).setTimestamp();

          case 13:
            exampleEmbed = _context.sent;
            _context.next = 16;
            return message.channel.send(exampleEmbed);

          case 16:
            _context.next = 21;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](10);
            message.channel.send("Error: Stock symbol not found");

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[10, 18]]);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());
discord_client.login(_config.discord_key);