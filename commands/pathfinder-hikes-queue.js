const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_CHANNEL_CLUBS,
} = require("../constants.js");
const { getDateTimeForPathfinderEventStart } = require("../utils/pathfinders");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-hikes-queue")
    .setDescription(
      "Fetch the current queue of maps submitted to Pathfinder Hikes playtesting"
    ),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in the <#${HALOFUNTIME_ID_CHANNEL_CLUBS}> channel.`,
        ephemeral: true,
      });
      return;
    }
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .get(`${HALOFUNTIME_API_URL}/pathfinder/hike-queue`, {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      })
      .then((response) => response.data)
      .catch(async (error) => {
        console.error(error);
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
      });
    if ("error" in response) {
      await interaction.reply({
        content: "Could not retrieve the Pathfinder Hikes queue at this time.",
        ephemeral: true,
      });
    } else {
      function buildField(submission) {
        return {
          name: `__${submission.map}__ (${submission.maxPlayerCount})`,
          value: `> **Modes:** ${submission.mode1} & ${submission.mode2}\n> **WAYWO:** <#${submission.waywoPostId}>\n> **Submitter:** <@${submission.mapSubmitterDiscordId}>`,
        };
      }
      const scheduledEmbeds = [];
      const scheduledDates = {};
      for (const submission of response.scheduled) {
        if (submission.scheduledPlaytestDate in scheduledDates) {
          scheduledDates[submission.scheduledPlaytestDate].push(submission);
        } else {
          scheduledDates[submission.scheduledPlaytestDate] = [submission];
        }
      }
      for (const date of Object.keys(scheduledDates)) {
        const scheduledSubmissions = scheduledDates[date];
        const fields = [];
        for (const submission of scheduledSubmissions) {
          fields.push(buildField(submission));
        }
        const scheduledStartDate = getDateTimeForPathfinderEventStart(
          dayjs(date, "YYYY-MM-DD")
        );
        scheduledEmbeds.push(
          new EmbedBuilder()
            .setColor(0xbc8fce)
            .setTitle(`Scheduled for <t:${scheduledStartDate.unix()}:D>`)
            .addFields(fields)
        );
      }
      const fields = [];
      for (const submission of response.unscheduled) {
        fields.push(buildField(submission));
      }
      const unscheduledEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("Unscheduled")
        .addFields(fields);
      await interaction.reply({
        embeds: [...scheduledEmbeds, unscheduledEmbed],
        allowedMentions: { parse: [] },
      });
    }
  },
};
