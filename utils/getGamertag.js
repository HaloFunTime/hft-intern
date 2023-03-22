const axios = require("axios");
const Discord = require("discord.js");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Receive an interaction from Discord.
async function getGamertagFromDiscordInteraction(interaction) {

  const HALOFUNTIME_API_KEY = process.env.HALOFUNTIME_API_KEY;
  const HALOFUNTIME_API_URL = process.env.HALOFUNTIME_API_URL;

  // Create a Discord ID & Tag for the user selected in the UserCommand. There is an ID but not a tag within the interaction. We need to make it.
  // Example id = 315984901826412545
  // Example tag = Jaxasaurous#4767
  const target_discord_id = interaction.targetUser.id;
  const target_discord_tag = interaction.targetUser.username + "#" + interaction.targetUser.discriminator;

  const request_url = `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${target_discord_id}&discordTag=${encodeURIComponent(
    target_discord_tag
  )}`;

  try {
    const response = await axios.get(request_url, {
      headers: {
        Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Return the error payload directly if present
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data,
      };
    }
    console.error("We failed to get a Gamertag for the user");
    console.error(error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

module.exports = getGamertagFromDiscordInteraction;