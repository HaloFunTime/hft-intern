const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
  HALOFUNTIME_ID_EMOJI_HEART_TRAILBLAZERS,
  HALOFUNTIME_ID_EMOJI_PASSION,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS,
} = require("../constants.js");
const { getCurrentEra, ERA_DATA } = require("../utils/eras");
const { getApplicationCommandMention } = require("../utils/formatting.js");

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
    // Command may only be executed in the Trailblazer Bot Commands thread
    if (
      interaction.channelId !== HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS
    ) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS}> thread.`,
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
      const currentEra = getCurrentEra();
      if (!currentEra) {
        await interaction.editReply({
          content:
            "Could not check your progress toward the Trailblazer Scout role at this time.",
          ephemeral: true,
        });
      }
      let earnedPromotion = false;
      // Create the base progress embed
      const progressEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Trailblazer Scout Progress")
        .setThumbnail("https://api.halofuntime.com/static/TrailblazerLogo.png");
      // Add the appropriate description and fields for the current era
      if (currentEra === "era01") {
        progressEmbed.setDescription("**Era 1**").addFields({
          name: "🦀 Church of the Crab",
          value: `> *Attend Trailblazer Tuesday! 50 points per session attended.*\n> **${
            response.pointsChurchOfTheCrab
          }/250 points** ${response.pointsChurchOfTheCrab === 250 ? "✅" : ""}`,
        });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "📈 CSR Go Up",
              value: `> *Win games in Ranked Arena. 1 point per win.*\n> **${
                response.pointsCSRGoUp
              }/200 points** ${response.pointsCSRGoUp === 200 ? "✅" : ""}`,
            })
            .addFields({
              name: "💀 Play To Slay",
              value: `> *Win Slayer games in Ranked Arena. 5 points per win.*\n> **${
                response.pointsPlayToSlay
              }/100 points** ${response.pointsPlayToSlay === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🏙️ Mean Streets",
              value: `> *Win games on the map Streets in Ranked Arena. 5 points per win.*\n> **${
                response.pointsMeanStreets
              }/100 points** ${response.pointsMeanStreets === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🔥 Hot Streak",
              value: `> *Win 3 consecutive Ranked Arena games and finish on top of the scoreboard each time. Earnable once.*\n> **${
                response.pointsHotStreak
              }/100 points** ${response.pointsHotStreak === 100 ? "✅" : ""}`,
            });
        }
      } else if (currentEra === "era02") {
        progressEmbed.setDescription("**Era 2**").addFields({
          name: "🦀 Church of the Crab",
          value: `> *Attend Trailblazer Tuesday! 50 points per session attended.*\n> **${
            response.pointsChurchOfTheCrab
          }/250 points** ${response.pointsChurchOfTheCrab === 250 ? "✅" : ""}`,
        });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "📈 CSR Go Up",
              value: `> *Win games in Ranked Arena. 1 point per win.*\n> **${
                response.pointsCSRGoUp
              }/200 points** ${response.pointsCSRGoUp === 200 ? "✅" : ""}`,
            })
            .addFields({
              name: "💪 Too Stronk",
              value: `> *Win Strongholds games in Ranked Arena. 5 points per win.*\n> **${
                response.pointsTooStronk
              }/100 points** ${response.pointsTooStronk === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "📺 Scoreboard",
              value: `> *Win games on the map Live Fire in Ranked Arena. 5 points per win.*\n> **${
                response.pointsScoreboard
              }/100 points** ${response.pointsScoreboard === 100 ? "✅" : ""}`,
            })
            .addFields({
              name: "🔄 The Cycle",
              value: `> *Win at least one CTF, KotH, Oddball, Slayer, and Strongholds game in Ranked Arena within a six-hour period. Earnable once.*\n> **${
                response.pointsTheCycle
              }/100 points** ${response.pointsTheCycle === 100 ? "✅" : ""}`,
            });
        }
      }
      // Add the gamertag link prompt field if needed
      if (!response.linkedGamertag) {
        const linkGamertagMention = await getApplicationCommandMention(
          "link-gamertag",
          interaction.client
        );

        progressEmbed.addFields({
          name: "🔗 Link your gamertag!",
          value: `> Link your Xbox Live Gamertag to HaloFunTime with the ${linkGamertagMention} command to unlock additional challenges tied to your in-game stats! Once your gamertag is verified by Staff, you'll see additional challenges in this section.`,
        });
      }
      // Add the total field, footer, and timestamp
      progressEmbed
        .addFields({
          name: "Your Total Trailblazer Scout Points",
          value: `> **${response.totalPoints}/500 points** ${
            response.totalPoints >= 500 ? "✅" : ""
          }\n`,
        })
        .setFooter({
          text: "Trailblazer Scout Progress",
        })
        .setTimestamp();
      await interaction.editReply({
        embeds: [progressEmbed],
      });
      // Check for a promotion
      if (currentEra !== null && response.totalPoints >= 500) {
        earnedPromotion = true;
      }
      if (earnedPromotion) {
        const promotionRoleId = ERA_DATA[currentEra].scoutRole;
        // Only promote if the user does not already have the role
        if (!interaction.member.roles.cache.has(promotionRoleId)) {
          await interaction.member.roles.add(promotionRoleId);
          const channel = interaction.client.channels.cache.get(
            HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS
          );
          const trailblazerPromotionMessage = await channel.send(
            `<@${interaction.user.id}> checked their challenge progress in <#${HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS}> and just earned the <@&${promotionRoleId}> role!`
          );
          await trailblazerPromotionMessage.react("🎉");
          await trailblazerPromotionMessage.react(
            HALOFUNTIME_ID_EMOJI_HEART_TRAILBLAZERS
          );
          await trailblazerPromotionMessage.react(HALOFUNTIME_ID_EMOJI_PASSION);
        }
      }
    }
  },
};
