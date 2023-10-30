const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_CHANNEL_VOD_REVIEW,
  HALOFUNTIME_ID_CHANNEL_CLUBS,
} = require("../constants.js");
const {
  getCurrentSeason,
  SEASON_03,
  SEASON_04,
  SEASON_05,
} = require("../utils/seasons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trailblazer-scout-progress")
    .setDescription("Check your progress toward the Trailblazer Scout role"),
  async execute(interaction) {
    // Command may only be executed by someone with the Trailblazer role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}> role to use this command. You can get it in <id:customize>.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply();
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/trailblazer/scout-progress`,
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
          "Could not check your progress toward the Trailblazer Scout role at this time.",
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
        .setColor(0x3498db)
        .setTitle("Trailblazer Scout Progress")
        .setThumbnail("https://api.halofuntime.com/static/TrailblazerLogo.png");
      // Add the appropriate description and fields for the current season
      if (currentSeason === SEASON_03) {
        progressEmbed
          .setDescription("**Season 3**")
          .addFields({
            name: "🦀 Church of the Crab",
            value: `> *Attend Trailblazer Tuesday! 50 points per session attended.*\n> **${
              response.pointsChurchOfTheCrab
            }/250 points** ${
              response.pointsChurchOfTheCrab === 250 ? "✅" : ""
            }`,
          })
          .addFields({
            name: "🫶 Sharing is Caring",
            value: `> *Bring someone new to Trailblazer Tuesday! 50 points per referral.*\n> **${
              response.pointsSharingIsCaring
            }/150 points** ${
              response.pointsSharingIsCaring === 150 ? "✅" : ""
            }`,
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
              }/200 points** ${
                response.pointsOnlineWarrior === 200 ? "✅" : ""
              }`,
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
        }
      } else if (currentSeason === SEASON_04) {
        progressEmbed
          .setDescription("**Season 4**")
          .addFields({
            name: "🦀 Church of the Crab",
            value: `> *Attend Trailblazer Tuesday! 50 points per session attended.*\n> **${
              response.pointsChurchOfTheCrab
            }/250 points** ${
              response.pointsChurchOfTheCrab === 250 ? "✅" : ""
            }`,
          })
          .addFields({
            name: "📚 Bookworm",
            value: `> *Submit a VOD in <#${HALOFUNTIME_ID_CHANNEL_VOD_REVIEW}>! 50 points per VOD.*\n> **${
              response.pointsBookworm
            }/150 points** ${response.pointsBookworm === 150 ? "✅" : ""}`,
          })
          .addFields({
            name: "🎥 Film Critic",
            value: `> *Write an excellent VOD review in <#${HALOFUNTIME_ID_CHANNEL_VOD_REVIEW}>! Earnable once.*\n> **${
              response.pointsFilmCritic
            }/100 points** ${response.pointsFilmCritic === 100 ? "✅" : ""}`,
          });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "🎮 Online Warrior",
              value: `> *Beat your Ranked Arena placement CSR by 200 or more. Earnable once.*\n> **${
                response.pointsOnlineWarrior
              }/200 points** ${
                response.pointsOnlineWarrior === 200 ? "✅" : ""
              }`,
            })
            .addFields({
              name: "🔄 The Cycle",
              value: `> *Win at least one CTF, KotH, Oddball, Slayer, and Strongholds game in Ranked Arena within a six-hour period. Earnable once.*\n> **${
                response.pointsTheCycle
              }/100 points** ${response.pointsTheCycle === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🏁 Checkered Flag",
              value: `> *Win Capture the Flag games in Ranked Arena. 4 points per win.*\n> **${
                response.pointsCheckeredFlag
              }/100 points** ${
                response.pointsCheckeredFlag === 100 ? "✅" : ""
              }`,
            })
            .addFields({
              name: "⛰ Them Thar Hills",
              value: `> *Win King of the Hill games in Ranked Arena. 4 points per win.*\n> **${
                response.pointsThemTharHills
              }/100 points** ${
                response.pointsThemTharHills === 100 ? "✅" : ""
              }`,
            });
        }
      } else if (currentSeason === SEASON_05) {
        progressEmbed.setDescription("**Season 5**").addFields({
          name: "🦀 Church of the Crab",
          value: `> *Attend Trailblazer Tuesday! 50 points per session attended.*\n> **${
            response.pointsChurchOfTheCrab
          }/250 points** ${response.pointsChurchOfTheCrab === 250 ? "✅" : ""}`,
        });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "🎮 Online Warrior",
              value: `> *Beat your Ranked Arena placement CSR by 200 or more. Earnable once.*\n> **${
                response.pointsOnlineWarrior
              }/200 points** ${
                response.pointsOnlineWarrior === 200 ? "✅" : ""
              }`,
            })
            .addFields({
              name: "🪙 Heads or Tails",
              value: `> *Get headshot kills in Ranked Arena. 1 point for every 5 headshot kills.*\n> **${
                response.pointsHeadsOrTails
              }/150 points** ${
                response.pointsHeadsOrTails === 150 ? "✅" : ""
              }`,
            })
            .addFields({
              name: "🔌 High Voltage",
              value: `> *Win games on the map Recharge in Ranked Arena. 5 points per win.*\n> **${
                response.pointsHighVoltage
              }/100 points** ${response.pointsHighVoltage === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "💀 Exterminator",
              value: `> *Achieve an Extermination in Ranked Arena. Earnable once.*\n> **${
                response.pointsExterminator
              }/100 points** ${
                response.pointsExterminator === 100 ? "✅" : ""
              }`,
            });
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
          name: "Your Total Trailblazer Scout Points",
          value: `> **${response.totalPoints}/500 points** ${
            response.totalPoints >= 500 ? "✅" : ""
          }\n> *Remember: promotions run every Tuesday morning!*\n`,
        })
        .setFooter({
          text: "Trailblazer Scout Progress",
        })
        .setTimestamp();
      await interaction.editReply({
        embeds: [progressEmbed],
      });
    }
  },
};
