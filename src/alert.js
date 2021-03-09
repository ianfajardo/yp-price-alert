/* psuedocode
  


*/
import { alert_key } from "./config";
import Discord, { MessageEmbed } from "discord.js";
import yahooFinance from "yahoo-finance";
import numeral from "numeral";

import fs from "fs";

const discord_client = new Discord.Client();
const refreshTime = 1000;

const prefix = "!";

/*
  setinterval - check quote's in lists
  loop alerts, if alert price
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
        const start = alert.start;
        const target = alert.target;

        var quote = await yahooFinance.quote({
          symbol: symbol,
          modules: ["price"], // optional; default modules.
        });

        //if if the target is more than the start, it means that only if the price rises to target or above will it trigger
        //if the target is less than the start, it means that only if hte price lowers to target or lower it will tigger
        if (
          (target >= start && quote.price.regularMarketPrice >= target) ||
          (target <= start && quote.price.regularMarketPrice <= target)
        ) {
          const channel_id = alert.channel_id;
          const username = alert.username;

          const embed = new Discord.MessageEmbed()
            .setColor("#16a085")
            .setTitle("$" + symbol + " Price Alert REACHED")
            .setDescription("PRICE HAS REACHED TARGET!")
            .setAuthor("@" + username)
            .addFields(
              { name: "Alert Target Price", value: numeral(target).format("$0,0.00") },
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
          if (err) throw err;
          console.log("alerts removed");
        });
      }

      //discord_client.channels.cache.get('818295613434888192').send('hello there!');
      //message.channel.send(alerts);
    }, 1000);
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

  alerts_data.alerts.push({
    user_id: user_id,
    username: username,
    channel_id: channel_id,
    symbol: symbol,
    start: start,
    target: target,
    timestamp: timestamp,
  });

  let updatedData = JSON.stringify(alerts_data, null, 2);

  fs.writeFile("alerts.json", updatedData, (err) => {
    if (err) throw err;

    const embed = new Discord.MessageEmbed()
      .setColor("#16a085")
      .setTitle("$" + symbol + " Price Alert Set")
      .setDescription(
        "When price has been reached, the bot will reply with a message on this channel."
      )
      .setAuthor("@" + username)
      .addFields(
        { name: "Alert Target Price", value: numeral(target).format("$0,0.00") },
        {
          name: "Current Price",
          value: numeral(start).format("$0,0.00"),
        }
      )
      .setTimestamp();

    discord_client.channels.cache.get(channel_id).send(embed);
  });
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
        `You didn't provide any arguments, ${message.author}!`
      );
    }

    var quotes = await yahooFinance.quote({
      symbol: args[0],
      modules: ["price", "summaryDetail", "summaryProfile"], // optional; default modules.
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
    }
  }
});

discord_client.login(alert_key);
