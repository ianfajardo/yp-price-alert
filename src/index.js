import { discord_key } from "./config";
import Discord, { MessageEmbed } from "discord.js";
import yahooFinance from "yahoo-finance";
import numeral from "numeral";

const discord_client = new Discord.Client();
const prefix = "!";

discord_client.once("ready", () => {
  console.log("Bot started");
});

discord_client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "stockprice") {
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
      const exampleEmbed = await new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle("$" + quotes.price.symbol)
        .setDescription(quotes.price.longName)
        .addFields({
          name: "Website",
          value: quotes.summaryProfile.website,
        })
        .addFields(
          {
            name: "Price",
            value: numeral(quotes.price.regularMarketPrice).format("$0,0.00"),
          },
          {
            name: "Today's Change",
            value:
              "(" +
              numeral(quotes.price.regularMarketChange).format("$0,0.00") +
              ") " +
              numeral(quotes.price.regularMarketChangePercent).format("0.00%"),
            inline: true,
          },
          {
            name: "High Today",
            value: numeral(quotes.price.regularMarketDayHigh).format("$0,0.00"),
            inline: true,
          },
          {
            name: "Low Today",
            value: numeral(quotes.price.regularMarketDayLow).format("$0,0.00"),
            inline: true,
          },
          {
            name: "Volume",
            value: numeral(quotes.price.regularMarketVolume).format("0.00a"),
            inline: true,
          }
        )
        .setTimestamp();

      await message.channel.send(exampleEmbed);
    }
    catch (error) {
      message.channel.send("Error: Stock symbol not found");
    }
  }
});

discord_client.login(discord_key);
