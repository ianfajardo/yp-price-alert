//config imports
import { alert_key } from "./config";

//util
import fs from "fs";
import numeral from "numeral";

//api
import Discord, { MessageEmbed } from "discord.js";
import yahooFinance from "yahoo-finance";

//logging
import log4js from "log4js";

log4js.configure({
  appenders: {
    alerts: { type: "file", filename: "logs/alerts.log" },
    errorFile: {
      type: "file",
      filename: "logs/errors.log",
    },
    errors: {
      type: "logLevelFilter",
      level: "ERROR",
      appender: "errorFile",
    },
  },
  categories: { default: { appenders: ["alerts", "errors"], level: "DEBUG" } },
});

let logger = log4js.getLogger("alerts");

const discord_client = new Discord.Client();
const refreshTime = 1000;

const prefix = "!";

/*
  setinterval - to loop through prices in alert list 
  if price hits target then 
  
*/

function priceChecker(message) {
  try {
    setInterval(async () => {
      let rawdata = fs.readFileSync("alerts.json");
      let alerts_data = JSON.parse(rawdata);

      let alertsForRemoval = [];

      for (let i = 0; i < alerts_data.alerts.length; i++) {
        const alert = alerts_data.alerts[i];
        const symbol = alert.symbol;
        let start = alert.start;
        let target = alert.target;

        if (start.constructor == Array) {
          start = start[0].raw;
        }
        if (target.constructor == Array) {
          target = target[0].raw;
        }

        var quote = await yahooFinance.quote({
          symbol: symbol,
          modules: ["price"], // optional; default modules.
        });

        /*

        if the target is more than the start, it means that only if the price rises to target or above will it trigger

        if the target is less than the start, it means that only if hte price lowers to target or lower it will tigger 

        */
        if (
          ((target >= start && quote.price.regularMarketPrice >= target) ||
            (target <= start && quote.price.regularMarketPrice <= target)) &&
          !isNaN(quote.price.regularMarketPrice)
        ) {
          const channel_id = alert.channel_id;
          const username = alert.username;

          logger.debug(
            "TARGET HIT! Target: " +
              target +
              "; Start: " +
              start +
              "; Quote: " +
              quote.price.regularMarketPrice
          );

          const embed = new Discord.MessageEmbed()
            .setColor("#16a085")
            .setTitle("$" + symbol + " Price Alert REACHED")
            .setDescription("PRICE HAS REACHED TARGET!")
            .setAuthor("@" + username)
            .addFields(
              {
                name: "Alert Target Price",
                value: numeral(target).format("$0,0.00"),
              },
              {
                name: "Current Price",
                value: numeral(start).format("$0,0.00"),
              }
            )
            .setTimestamp();

          discord_client.channels.cache.get(channel_id).send(embed);
          alertsForRemoval.push(i);
        }
      }

      if (alertsForRemoval.length > 0) {
        for (let i = 0; i < alertsForRemoval.length; i++) {
          const e = alertsForRemoval[i];
          alerts_data.alerts.splice(e, 1);
        }

        let updatedData = JSON.stringify(alerts_data, null, 2);

        fs.writeFile("alerts.json", updatedData, (err) => {
          if (err) {
            logger.error(err);
          }
          logger.debug("Alerts Removed");
        });
      }

      //discord_client.channels.cache.get('818295613434888192').send('hello there!');
      //message.channel.send(alerts);
    }, 1000);
  } catch (error) {
    logger.error(err);
  }
}

/*
  !stockalert symbol target
  ex:
  !stockalert AAPL 150
*/
function saveAlert(
  user_id,
  username,
  symbol,
  start,
  target,
  timestamp,
  channel_id
) {
  let rawdata = fs.readFileSync("alerts.json");
  let alerts_data = JSON.parse(rawdata);

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
      timestamp: timestamp,
    });

    logger.debug(
      "ALERT ADDED! user_id:" +
        user_id +
        ", username:" +
        username +
        ", channel_id:" +
        channel_id +
        ", symbol:" +
        symbol +
        ", start:" +
        start +
        ", target:" +
        target +
        ", timestamp:" +
        timestamp
    );

    let updatedData = JSON.stringify(alerts_data, null, 2);

    fs.writeFile("alerts.json", updatedData, (err) => {
      if (err) {
        logger.error(err);
      }

      const embed = new Discord.MessageEmbed()
        .setColor("#16a085")
        .setTitle("$" + symbol + " Price Alert Set")
        .setDescription(
          "When price has been reached, the bot will reply with a message on this channel."
        )
        .setAuthor("@" + username)
        .addFields(
          {
            name: "Alert Target Price",
            value: numeral(target).format("$0,0.00"),
          },
          {
            name: "Current Price",
            value: numeral(start).format("$0,0.00"),
          }
        )
        .setTimestamp();

      discord_client.channels.cache.get(channel_id).send(embed);
    });
  }
}

function deleteAlert(user_id, username, alert_id, channel_id) {
  let rawdata = fs.readFileSync("alerts.json");
  let alerts_data = JSON.parse(rawdata);

  console.log(alert_id);

  if (alerts_data.alerts[alert_id].user_id === user_id) {
    alerts_data.alerts.splice(alert_id, 1);

    let updatedData = JSON.stringify(alerts_data, null, 2);

    fs.writeFile("alerts.json", updatedData, (err) => {
      if (err) {
        throw new Error(
          "Alert doesn't exists to be removed.  Please check ID in list."
        );
        logger.error(err);
      }
    });

    discord_client.channels.cache.get(channel_id).send("Alert Removed");
  } else {
    throw new Error("Alert doesn't exists.  Please check ID in list.");
  }
}

function viewAlert(user_id, username, channel_id) {
  let rawdata = fs.readFileSync("alerts.json");
  let alerts_data = JSON.parse(rawdata);

  let embed = new Discord.MessageEmbed()
    .setColor("#16a085")
    .setTitle("@" + username + "'s Alert List");

  for (let i = 0; i < alerts_data.alerts.length; i++) {
    const alert = alerts_data.alerts[i];
    if (alert.user_id === user_id) {
      embed.addFields(
        { name: "ID", value: i, inline: true },
        {
          name: "Symbol",
          value: alert.symbol,
          inline: true,
        },
        {
          name: "Alert Target Price",
          value: numeral(alert.target).format("$0,0.00"),
          inline: true,
        }
      );
    }
  }

  discord_client.channels.cache.get(channel_id).send(embed);
}

discord_client.once("ready", async (message) => {
  //once bot is ready start the loop only once to keep checking the price alerts file for matches
  priceChecker(message);
});

discord_client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "stockalert") {
    if (!args.length) {
      return message.channel.send(
        `You didn't provide any arguments, ${message.author}! \n\n` +
        `Commands:\n` +
        `!stockAlert [SYMBOL] [TARGETPRICE] ex: !stockAlert GME 1200.25\n` +
        `!stockAlert view \n` +
        `!stockAlert delete [ID] ex: !stockAlert delete 3 \n` 
      );
    }

    if (args[0].toLowerCase() === "view") {
      viewAlert(
        message.member.user.id,
        message.member.user.username,
        message.channel.id
      );
    } else if (args[0] === "delete") {
      var alert_id = args[1];
      try {
        await deleteAlert(
          message.member.user.id,
          message.member.user.username,
          alert_id,
          message.channel.id
        );
      } catch (error) {
        message.channel.send("Error: " + error);
        logger.error(error);
      }
    } else {
      var quotes = await yahooFinance.quote({
        symbol: args[0],
        modules: ["price", "summaryDetail", "summaryProfile"],
      });

      try {
        //user_id, symbol, start, target, timestamp, channel_id
        await saveAlert(
          message.member.user.id,
          message.member.user.username,
          args[0],
          quotes.price.regularMarketPrice,
          args[1],
          message.createdAt,
          message.channel.id
        );
      } catch (error) {
        message.channel.send("Error: " + error);
        logger.error(error);
      }
    }
  }
});

discord_client.login(alert_key);
