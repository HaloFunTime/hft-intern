const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_CHANNEL_CLUBS,
} = require("../constants.js");
const { getCurrentSeason, SEASON_03, SEASON_04 } = require("../utils/seasons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-dynamo-progress")
    .setDescription("Check your progress toward the Pathfinder Dynamo role"),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in the <#${HALOFUNTIME_ID_CHANNEL_CLUBS}> channel.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply();
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/dynamo-progress`,
        {
          discordUserId: interaction.user.id,
          discordUserTag: interaction.user.tag,
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
          "Could not check your progress toward the Pathfinder Dynamo role at this time.",
        ephemeral: true,
      });
    } else {
      const currentSeason = getCurrentSeason();
      if (!currentSeason) {
        await interaction.editReply({
          content:
            "Could not check your progress toward the Trailblazer Scout role at this time.",
          ephemeral: true,
        });
      }
      // Create the base progress embed
      const progressEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("Pathfinder Dynamo Progress")
        .setThumbnail("https://api.halofuntime.com/static/PathfinderLogo.png");
      // Add the appropriate description and fields for the current season
      if (currentSeason == SEASON_03) {
        progressEmbed
          .setDescription("**Season 3**")
          .addFields({
            name: "🥾 Gone Hiking",
            value: `> *Attend Pathfinder Hikes playtesting! 50 points per session attended.*\n> **${
              response.pointsGoneHiking
            }/250 points** ${response.pointsGoneHiking === 250 ? "✅" : ""}`,
          })
          .addFields({
            name: "🗺 Map Maker",
            value: `> *Submit a map to Pathfinder Hikes playtesting! 50 points per submission.*\n> **${
              response.pointsMapMaker
            }/150 points** ${response.pointsMapMaker === 150 ? "✅" : ""}`,
          })
          .addFields({
            name: "🧱 Show and Tell",
            value: `> *Create a <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> post for a project you're working on! 50 points per post.*\n> **${
              response.pointsShowAndTell
            }/100 points** ${response.pointsShowAndTell === 100 ? "✅" : ""}`,
          });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "🔖 Bookmarked",
              value: `> *Publish a map that receives 100 or more bookmarks. Earnable once.*\n> **${
                response.pointsBookmarked
              }/100 points** ${response.pointsBookmarked === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🎮 Playtime",
              value: `> *Publish a map that receives 500 or more plays. Earnable once.*\n> **${
                response.pointsPlaytime
              }/100 points** ${response.pointsPlaytime === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🏷 Tagtacular",
              value: `> *Tag one of your published maps with 'HaloFunTime'. 25 points per tag.*\n> **${
                response.pointsTagtacular
              }/100 points** ${response.pointsTagtacular === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🔥 Forged in Fire",
              value: `> *Spend time playing Custom Games on Forge maps. 1 point per full hour played.*\n> **${
                response.pointsForgedInFire
              }/200 points** ${
                response.pointsForgedInFire === 200 ? "✅" : ""
              }`,
            });
        } else if (currentSeason == SEASON_04) {
          progressEmbed.setDescription("**Season 4**");
          // TODO: Add fields for Season 4 Pathfinder Dynamo challenges here
        }
      }
      // Add the gamertag link prompt field if needed
      if (!response.linkedGamertag) {
        progressEmbed.addFields({
          name: "🔗 Link your gamertag!",
          value:
            "> Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to unlock additional challenges tied to your in-game stats! Once your gamertag is verified by Staff, you'll see additional challenges in this section.",
        });
      }
      // Add the total field, footer, and timestamp
      progressEmbed
        .addFields({
          name: "Your Total Pathfinder Dynamo Points",
          value: `> **${response.totalPoints}/500 points** ${
            response.totalPoints >= 500 ? "✅" : ""
          }\n> *Remember: promotions run every Tuesday morning!*\n`,
        })
        .setFooter({
          text: "Pathfinder Dynamo Progress",
        })
        .setTimestamp();
      await interaction.editReply({
        embeds: [progressEmbed],
      });
    }
  },
};
