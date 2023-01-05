const fs = require("node:fs");
const path = require("node:path");
const cron = require("node-cron");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const {
  createFunTimeFridayEvent,
  focusFunTimeFridayEvent,
  unfocusFunTimeFridayEvent,
} = require("./cron/funTimeFriday");

dotenv.config();

const { BOT_TOKEN } = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});

// Set up commands dynamically using the contents of the /commands folder
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Set up customInteractions dynamically using the contents of the /customInteractions folder
client.customInteractions = new Collection();
const customInteractionsPath = path.join(__dirname, "customInteractions");
const customInteractionFiles = fs
  .readdirSync(customInteractionsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of customInteractionFiles) {
  const filePath = path.join(customInteractionsPath, file);
  const customInteraction = require(filePath);
  client.customInteractions.set(customInteraction.name, customInteraction);
}

// Set up events dynamically using the contents of the /events folder
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(BOT_TOKEN);

// Schedule all future cronjobs when the client emits the "ready" event
client.on("ready", () => {
  // Schedule weekly creation of the Fun Time Friday event - Thursdays at noon Mountain
  cron.schedule(
    "0 0 12 * * 4",
    () => {
      try {
        createFunTimeFridayEvent(client);
      } catch (e) {
        console.error(e);
      }
    },
    {
      scheduled: true,
      timezone: "America/Denver",
    }
  );
  // Schedule weekly focusing of the Fun Time Friday category - Fridays at 4PM Mountain
  cron.schedule(
    "0 0 16 * * 5",
    () => {
      try {
        focusFunTimeFridayEvent(client);
      } catch (e) {
        console.error(e);
      }
    },
    {
      scheduled: true,
      timezone: "America/Denver",
    }
  );
  // Schedule weekly unfocusing of the Fun Time Friday category - Saturdays at 3AM Mountain
  cron.schedule(
    "0 0 3 * * 6",
    () => {
      try {
        unfocusFunTimeFridayEvent(client);
      } catch (e) {
        console.error(e);
      }
    },
    {
      scheduled: true,
      timezone: "America/Denver",
    }
  );
});
