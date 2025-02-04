const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE,
  HALOFUNTIME_ID_CHANNEL_STAFF,
  HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");
const { ERA_DATA } = require("../utils/eras.js");
const { getApplicationCommandMention } = require("../utils/formatting.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("board-boat")
    .setDescription(
      "Board the S.S. FunTime and join the Era 3 Boat Challenge."
    ),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const joinChallengeStart = ERA_DATA["era03"].startTime;
    const joinChallengeEnd = ERA_DATA["era03"].endTime;
    if (
      now < joinChallengeStart &&
      !interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)
    ) {
      await interaction.reply({
        content: "You can't board the boat to join the **Boat Challenge** yet.",
        ephemeral: true,
      });
      return;
    } else if (now > joinChallengeEnd) {
      await interaction.reply({
        content: "The **Boat Challenge** is over. That ship has sailed.",
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Boat Challenge channel
    if (
      interaction.channelId !== HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE &&
      !interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF) &&
      interaction.channelId !== HALOFUNTIME_ID_CHANNEL_STAFF
    ) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE}> channel.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({
      allowedMentions: { users: [interaction.user.id] },
    });
    // Hit the HFT API with a join request
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/era-03/board-boat`,
        {
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
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
    if (!response || "error" in response) {
      await interaction.editReply({
        content:
          "I can't let you aboard the boat this time. Try again in a couple minutes.",
        ephemeral: true,
      });
      return;
    }
    // Respond
    let responseContent;
    const embeds = [];
    const checkBoatAssignmentsMention = await getApplicationCommandMention(
      "check-boat-assignments",
      interaction.client
    );
    if (response.newJoiner) {
      responseContent = `Welcome aboard the S.S. FunTime, <@${interaction.user.id}>. Your rank is **${response.rank}**.\n\n`;
      responseContent += `Maybe someday you'll be worthy of the title <@&${HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN}>... but for now, you work for me.\n\n`;
      responseContent += `Use ${checkBoatAssignmentsMention} to see how you can help me out.`;
    } else {
      responseContent = `<@${interaction.user.id}>, your rank is **${response.rank}**. Use ${checkBoatAssignmentsMention} to see how you can help me out.`;
    }
    await interaction.editReply({
      content: responseContent,
      embeds: embeds,
    });
  },
};
