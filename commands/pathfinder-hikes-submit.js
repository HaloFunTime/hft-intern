const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
} = require("../constants.js");
const { MAX_PLAYER_COUNT_CHOICES } = require("../utils/pathfinders.js");
const { getApplicationCommandMention } = require("../utils/formatting.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-hikes-submit")
    .setDescription(
      "Submit a map to the Pathfinder Hikes weekly playtest session"
    )
    .addStringOption((option) =>
      option
        .setName("players")
        .setDescription("The maximum number of players to test with")
        .setMaxLength(32)
        .setRequired(true)
        .addChoices(...MAX_PLAYER_COUNT_CHOICES)
    )
    .addStringOption((option) =>
      option
        .setName("map")
        .setDescription("The name of the map")
        .setMaxLength(32)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("The name of the mode to test")
        .setMaxLength(32)
        .setRequired(true)
    ),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in <id:customize>.`,
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed on a post in the WAYWO channel
    let inWaywoChannel = false;
    if (
      interaction.channel.isThread &&
      interaction.channel.parentId === HALOFUNTIME_ID_CHANNEL_WAYWO
    ) {
      inWaywoChannel = true;
    }
    if (!inWaywoChannel) {
      await interaction.reply({
        content: `You may only use this command on a post in the <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> channel.`,
        ephemeral: true,
      });
      return;
    }
    const players = interaction.options.getString("players");
    const map = interaction.options.getString("map");
    const mode = interaction.options.getString("mode");
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/hike-submission`,
        {
          waywoPostTitle: interaction.channel.name,
          waywoPostId: interaction.channelId,
          mapSubmitterDiscordId: interaction.user.id,
          mapSubmitterDiscordUsername: interaction.user.username,
          maxPlayerCount: players,
          map: map,
          mode: mode,
        },
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        console.error(error);
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
      });
    if (response.success) {
      const hikesQueueMention = await getApplicationCommandMention(
        "pathfinder-hikes-queue",
        interaction.client
      );
      await interaction.reply({
        content: `<@${interaction.user.id}> spent 50 🫘 **Pathfinder Beans** to submit **${map}** for **Pathfinder Hikes** playtesting!\n\nUse ${hikesQueueMention} to view the queue of maps submitted for playtesting.`,
      });
    } else if ("error" in response) {
      // Try to figure out a "friendly" rejection message
      let friendlyMessage = "";
      if (response?.error?.status_code === 403) {
        if (
          response?.error?.details?.detail ===
          "A Pathfinder Hike submission already exists for this post."
        ) {
          friendlyMessage =
            "\n\nThe map referenced by this post has already been submitted for playtesting. It may be submitted again after the currently scheduled playtest has been completed.";
        }
        if (
          response?.error?.details?.detail ===
          "This Discord user does not have enough Pathfinder Beans for a Hike submission."
        ) {
          const checkBeansMention = await getApplicationCommandMention(
            "check-beans",
            interaction.client
          );
          friendlyMessage = `\n\nYou must have at least 50 🫘 **Pathfinder Beans** to submit a playtest request. Check your current total with ${checkBeansMention}.`;
        }
      }
      await interaction.reply({
        content: `Your submission was rejected.${friendlyMessage}`,
        ephemeral: true,
      });
    }
  },
};
