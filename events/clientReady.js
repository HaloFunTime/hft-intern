const { ActivityType, Client } = require("discord.js");

module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.username}.`);
    client.user.setActivity("instructions", {
      type: ActivityType.Listening,
    });

    // create application command cache
    client.application.commands.fetch();
  },
};
