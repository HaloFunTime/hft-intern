const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE } = require("../constants.js");
const members = require("../utils/members");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join-domain-challenge")
    .setDescription("Join the Season 5 Domain Challenge. No takebacks."),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const domainChallengeStart = dayjs.tz(
      "2023-10-17 11:00:00",
      "America/Denver"
    );
    const domainChallengeEnd = dayjs.tz(
      "2024-02-13 09:00:00",
      "America/Denver"
    );
    if (now < domainChallengeStart) {
      await interaction.reply({
        content:
          "Contain your enthusiasm. The **Domain Challenge** hasn't started yet.",
        ephemeral: true,
      });
      return;
    } else if (now > domainChallengeEnd) {
      await interaction.reply({
        content: "The **Domain Challenge** is over. Tough.",
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Domain Challenge channel
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE}> channel.`,
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
        `${HALOFUNTIME_API_URL}/season-05/join-challenge`,
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
    if ("error" in response) {
      await interaction.editReply({
        content:
          "You couldn't join the Domain Challeng at this time. Sucks for you.",
        ephemeral: true,
      });
      return;
    }
    // Assign relevant roles
    const { roleId, emojiId, emojiString } =
      await members.updateDomainChallengeTeamRole(
        interaction.member,
        response.assignedTeam
      );
    // Respond
    let responseContent;
    if (!roleId) {
      responseContent =
        "You're not a member of a team right now. Maybe one of us will pick you up. Or not.";
    } else if (response.newJoiner) {
      responseContent = `<@${interaction.user.id}> has been assigned to ${emojiString} <@&${roleId}>.`;
    } else {
      responseContent = `<@${interaction.user.id}> already belongs to ${emojiString} <@&${roleId}>.`;
    }
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      content: responseContent,
    });
  },
};
