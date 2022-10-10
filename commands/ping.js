const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the HaloFunTime services for signs of life"),
  async execute(interaction) {
    const response = await axios.get("https://api.halofuntime.com/ping/");
    if (response.data.success) {
      await interaction.reply("HaloFunTime services are alive and well.");
    } else {
      await interaction.reply(
        "HaloFunTime services might be dead. Ping the Staff, hurry!"
      );
    }
  },
};
