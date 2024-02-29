const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { LINK_GAMERTAG_ID, LINK_GAMERTAG_NAME } = require("../constants");

const MATCH_TYPE_CHOICES = [
  { name: "Matchmaking", value: "Matchmaking" },
  { name: "Custom", value: "Custom" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recent-games")
    .setDescription("List a player's recent games")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("gamertag")
        .setDescription("List recent games for an Xbox Live gamertag")
        .addStringOption((option) =>
          option
            .setName("gamertag")
            .setDescription("A valid Xbox Live gamertag")
            .setMaxLength(15)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The type of recent games to retrieve")
            .setMaxLength(32)
            .setRequired(true)
            .addChoices(...MATCH_TYPE_CHOICES)
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
        .setDescription("List recent games for a Discord member")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("A member of HaloFunTime")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The type of recent games to retrieve")
            .setMaxLength(32)
            .setRequired(true)
            .addChoices(...MATCH_TYPE_CHOICES)
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
    const quiet = interaction.options.getBoolean("quiet") ?? true;
    let gamertag = interaction.options.getString("gamertag");
    const matchType = interaction.options.getString("type");
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
        return;
      } else {
        gamertag = response.xboxLiveGamertag;
      }
    }
    await interaction.deferReply({
      allowedMentions: { parse: ["users"] },
      ephemeral: quiet,
    });
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/halo-infinite/recent-games?gamertag=${encodeURIComponent(
          gamertag
        )}&matchType=${encodeURIComponent(matchType)}`,
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
          content: `An unknown error occurred while attempting to fetch CSR data for \`${gamertag}\`.`,
          ephemeral: true,
        });
      }
    } else {
      const gameEmbeds = [];
      for (let game of response.games) {
        let embedColor = 0x666666;
        if (game.finished) {
          if (game.outcome === "Won") {
            embedColor = 0x2ecc71;
          } else if (game.outcome === "Lost") {
            embedColor = 0xe74c3c;
          } else if (game.outcome === "Tied") {
            embedColor = 0xf8db4a;
          }
        }
        const gameEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .addFields({
            name: " ",
            value: `[${game.modeName}](https://www.halowaypoint.com/halo-infinite/ugc/modes/${game.modeAssetId}) on [${game.mapName}](https://www.halowaypoint.com/halo-infinite/ugc/maps/${game.mapAssetId})\n**${game.outcome}** - [View Stats](https://leafapp.co/game/${game.matchId})`,
          })
          .setThumbnail(game.mapThumbnailURL);
        gameEmbeds.push(gameEmbed);
      }
      if (gameEmbeds.length === 0) {
        let description = `\`${response.gamertag}\` has no recent games.`;
        gameEmbeds.push(
          new EmbedBuilder()
            .setTitle("No Recent Games")
            .setDescription(description)
        );
      }
      await interaction.editReply({
        embeds: gameEmbeds,
        ephemeral: quiet,
      });
    }
  },
};
