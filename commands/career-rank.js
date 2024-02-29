const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { LINK_GAMERTAG_ID, LINK_GAMERTAG_NAME } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("career-rank")
    .setDescription("Check a player's Career Rank")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("gamertag")
        .setDescription("Get Career Rank for an Xbox Live gamertag")
        .addStringOption((option) =>
          option
            .setName("gamertag")
            .setDescription("A valid Xbox Live gamertag")
            .setMaxLength(15)
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("quiet")
            .setDescription("Should I post the result quietly?")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("member")
        .setDescription("Get Career Rank for a Discord member")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("A member of HaloFunTime")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("quiet")
            .setDescription("Should I post the result quietly?")
            .setRequired(false)
        )
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    let gamertag = interaction.options.getString("gamertag");
    if (!gamertag) {
      const member = interaction.options.getUser("member");
      const response = await axios
        .get(
          `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${
            member.id
          }&discordUsername=${encodeURIComponent(member.username)}`,
          {
            headers: {
              Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
          }
        )
        .then((response) => response.data)
        .catch(async (error) => {
          // Return the error payload directly if present
          if (error.response.data) {
            return error.response.data;
          }
          console.error(error);
        });
      if ("error" in response) {
        // Send a reply that potentially pings the member if they haven't linked a gamertag
        await interaction.reply({
          content:
            `<@${member.id}> hasn't linked a gamertag on HaloFunTime. ` +
            `They can use </${LINK_GAMERTAG_NAME}:${LINK_GAMERTAG_ID}> at any time to do so.`,
          allowedMentions: { users: [member.id] },
          ephemeral: quiet,
        });
      } else {
        gamertag = response.xboxLiveGamertag;
      }
    }
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/halo-infinite/career-rank?gamertag=${encodeURIComponent(
          gamertag
        )}`,
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    if ("error" in response) {
      if (response.error.details?.detail) {
        await interaction.reply({
          content: response.error.details.detail,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `An unknown error occurred while attempting to fetch Career Rank data for \`${gamertag}\`.`,
          ephemeral: true,
        });
      }
    } else {
      const percentToNextRank = (
        (response.currentRankScore / response.currentRankScoreMax) *
        100
      ).toFixed(1);
      const percentToHero = (
        (response.cumulativeScore / response.cumulativeScoreMax) *
        100
      ).toFixed(1);
      const progressLine =
        response.currentRankNumber <= 270
          ? `${percentToNextRank}% to next rank; ${percentToHero}% to Hero`
          : "MAXIMUM CAREER RANK";
      const careerRankEmbed = new EmbedBuilder()
        .setTitle(response.currentRankName)
        .setThumbnail(
          `https://api.halofuntime.com/static/career_rank_images/${response.currentRankNumber}.png`
        )
        .addFields({
          name: progressLine,
          value: "**GT:** `" + response.gamertag + "`",
        })
        .setTimestamp()
        .setFooter({
          text: "Current Career Rank",
        });
      if (response.currentRankName === "Hero") {
        const heroLinks = [
          "https://www.youtube.com/watch?v=lXgkuM2NhYI",
          "https://www.youtube.com/watch?v=EqWRaAF6_WY",
          "https://www.youtube.com/watch?v=bWcASV2sey0",
          "https://www.youtube.com/watch?v=koJlIGDImiU",
          "https://www.youtube.com/watch?v=a7SouU3ECpU",
        ];
        const heroLink = heroLinks[(heroLinks.length * Math.random()) | 0];
        careerRankEmbed.setURL(heroLink);
      }
      await interaction.reply({
        embeds: [careerRankEmbed],
        ephemeral: quiet,
      });
    }
  },
};
