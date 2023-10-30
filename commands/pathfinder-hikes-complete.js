const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
} = require("../constants.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-hikes-complete")
    .setDescription(
      "Submit a map to the Pathfinder Hikes weekly playtest session"
    )
    .addStringOption((option) =>
      option
        .setName("playtest-game-id")
        .setDescription("The ID of the playtest game")
        .setMaxLength(36)
        .setRequired(true)
    ),
  async execute(interaction) {
    // Command may only be executed by someone with the Staff role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_STAFF}> role to use this command.`,
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
    const playtestGameId = interaction.options.getString("playtest-game-id");
    const discordUsersInVoice = [];
    const voiceChannelId = interaction.member.voice.channelId;
    if (voiceChannelId) {
      const voiceChannel =
        interaction.client.channels.cache.get(voiceChannelId);
      voiceChannel.members.forEach((member) => {
        discordUsersInVoice.push({
          discordId: member.user.id,
          discordUsername: member.user.username,
        });
      });
    }
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/hike-complete`,
        {
          playtestGameId: playtestGameId,
          discordUsersInVoice: discordUsersInVoice,
          waywoPostId: interaction.channelId,
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
      const awardMentions = [];
      response.awardedUsers.forEach((awardedUser) => {
        awardMentions.push(
          `<@${awardedUser.discordId}> earned ${awardedUser.awardedBeans} 🫘 **Pathfinder Beans**!`
        );
      });
      const playtestLine = `View playtest stats here: https://leafapp.co/game/${playtestGameId}`;
      await interaction.reply({
        allowedMentions: { parse: ["users"] },
        content: `${awardMentions.join("\n")}\n\n${playtestLine}`,
      });
    } else if ("error" in response) {
      // Try to figure out a "friendly" rejection message
      let friendlyMessage = "";
      if (response?.error?.status_code === 403) {
        if (
          response?.error?.details?.detail ===
          "Could not find an incomplete Pathfinder Hike Submission associated with this WAYWO Post."
        ) {
          friendlyMessage =
            "\n\nThe system could not find an incomplete Pathfinder Hike Submission associated with this WAYWO Post.";
        }
      }
      await interaction.reply({
        content: `Hike could not be completed.${friendlyMessage}`,
        ephemeral: true,
      });
    }
  },
};
