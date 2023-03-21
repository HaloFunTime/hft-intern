const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_CHANNEL_VOD_REVIEW,
  HALOFUNTIME_ID_CHANNEL_CLUBS,
} = require("../constants.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trailblazer-scout-progress")
    .setDescription("Check your progress toward the Trailblazer Scout role"),
  async execute(interaction) {
    // Command may only be executed by someone with the Trailblazer role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}> role to use this command. You can get it in the <#${HALOFUNTIME_ID_CHANNEL_CLUBS}> channel.`,
        ephemeral: true,
      });
      return;
    }
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/trailblazer/scout-progress`,
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
      await interaction.reply({
        content:
          "Could not check your progress toward the Trailblazer Scout role at this time.",
        ephemeral: true,
      });
    } else {
      const progressEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Trailblazer Scout Progress")
        .setThumbnail("https://api.halofuntime.com/static/TrailblazerLogo.png")
        .setDescription("**Season 3**")
        .addFields({
          name: "🦀 Church of the Crab",
          value: `> *Attend Trailblazer Tuesday! 50 points per attendance.*\n> **${
            response.pointsChurchOfTheCrab
          }/250 points** ${response.pointsChurchOfTheCrab === 250 ? "✅" : ""}`,
        })
        .addFields({
          name: "🫶 Sharing is Caring",
          value: `> *Bring someone new to Trailblazer Tuesday! 50 points per referral.*\n> **${
            response.pointsSharingIsCaring
          }/150 points** ${response.pointsSharingIsCaring === 150 ? "✅" : ""}`,
        })
        .addFields({
          name: "📚 Bookworm",
          value: `> *Submit a VOD in <#${HALOFUNTIME_ID_CHANNEL_VOD_REVIEW}>! 50 points per VOD.*\n> **${
            response.pointsBookworm
          }/100 points** ${response.pointsBookworm === 100 ? "✅" : ""}`,
        });
      if (response.linkedGamertag) {
        progressEmbed
          .addFields({
            name: "🎮 Online Warrior",
            value: `> *Beat your Ranked Arena placement CSR by 200 or more. Earnable once.*\n> **${
              response.pointsOnlineWarrior
            }/200 points** ${response.pointsOnlineWarrior === 200 ? "✅" : ""}`,
          })
          .addFields({
            name: "🔥 Hot Streak",
            value: `> *Win 3 consecutive Ranked Arena games and finish on top of the scoreboard each time. Earnable once.*\n> **${
              response.pointsHotStreak
            }/100 points** ${response.pointsHotStreak === 100 ? "✅" : ""}`,
          })
          .addFields({
            name: "💀 Oddly Effective",
            value: `> *Win Oddball games in Ranked Arena. 4 points per win.*\n> **${
              response.pointsOddlyEffective
            }/100 points** ${
              response.pointsOddlyEffective === 100 ? "✅" : ""
            }`,
          })
          .addFields({
            name: "💪 Too Stronk",
            value: `> *Win Strongholds games in Ranked Arena. 4 points per win.*\n> **${
              response.pointsTooStronk
            }/100 points** ${response.pointsTooStronk === 100 ? "✅" : ""}`,
          });
      } else {
        progressEmbed.addFields({
          name: "🔗 Link your gamertag!",
          value:
            "> Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to unlock additional challenges tied to your in-game stats! Once your gamertag is verified by Staff, you'll see additional challenges in this section.",
        });
      }
      progressEmbed
        .addFields({
          name: "Your Total Trailblazer Scout Points",
          value: `> *Remember: promotions run every Tuesday morning!*\n> **${
            response.totalPoints
          }/500 points** ${response.totalPoints >= 500 ? "✅" : ""}`,
        })
        .setFooter({
          text: "Trailblazer Scout Progress",
        })
        .setTimestamp();
      await interaction.reply({
        embeds: [progressEmbed],
      });
    }
  },
};
