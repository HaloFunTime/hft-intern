const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_EMOJI_HEART_PATHFINDERS,
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS,
} = require("../constants.js");
const { getCurrentEra, ERA_DATA } = require("../utils/eras");
const { getApplicationCommandMention } = require("../utils/formatting.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-dynamo-progress")
    .setDescription("Check your progress toward the Pathfinder Dynamo role"),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in <id:customize>.`,
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Pathfinder Bot Commands thread
    if (
      interaction.channelId !== HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS
    ) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS}> thread.`,
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
          "Could not check your progress toward the Pathfinder Dynamo role at this time.",
        ephemeral: true,
      });
    } else {
      const currentEra = getCurrentEra();
      if (!currentEra) {
        await interaction.editReply({
          content:
            "Could not check your progress toward the Pathfinder Dynamo role at this time.",
          ephemeral: true,
        });
      }
      let earnedPromotion = false;
      // Create the base progress embed
      const progressEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("Pathfinder Dynamo Progress")
        .setThumbnail("https://api.halofuntime.com/static/PathfinderLogo.png");
      // Add the appropriate description and fields for the current era
      if (currentEra === "era01") {
        progressEmbed
          .setDescription("**Era 1**")
          .addFields({
            name: "🫘 Bean Spender",
            value: `> *Spend 50 🫘 **Pathfinder Beans** to submit a map to Pathfinder Hikes playtesting. Earnable once.*\n> **${
              response.pointsBeanSpender
            }/200 points** ${response.pointsBeanSpender === 200 ? "✅" : ""}`,
          })
          .addFields({
            name: "🧱 What Are You Working On?",
            value: `> *Create a* <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> *post for a project you're working on. 50 points per post.*\n> **${
              response.pointsWhatAreYouWorkingOn
            }/150 points** ${
              response.pointsWhatAreYouWorkingOn === 150 ? "✅" : ""
            }`,
          })
          .addFields({
            name: "💬 Feedback Fiend",
            value: `> *Comment on* <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> *posts. 1 point per comment.*\n> **${
              response.pointsFeedbackFiend
            }/100 points** ${response.pointsFeedbackFiend === 100 ? "✅" : ""}`,
          });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "🥾 Gone Hiking",
              value: `> *Attend Pathfinder Hikes playtesting in-game! 10 points per map hiked.*\n> **${
                response.pointsGoneHiking
              }/250 points** ${response.pointsGoneHiking === 250 ? "✅" : ""}`,
            })
            .addFields({
              name: "🔥 Forged in Fire",
              value: `> *Spend time playing Custom Games on maps made on Forge canvases. 1 point per full hour played.*\n> **${
                response.pointsForgedInFire
              }/100 points** ${
                response.pointsForgedInFire === 100 ? "✅" : ""
              }`,
            });
        }
      } else if (currentEra === "era02") {
        progressEmbed
          .setDescription("**Era 2**")
          .addFields({
            name: "🫘 Bean Spender",
            value: `> *Spend 50 🫘 **Pathfinder Beans** to submit a map to Pathfinder Hikes playtesting. Earnable once.*\n> **${
              response.pointsBeanSpender
            }/200 points** ${response.pointsBeanSpender === 200 ? "✅" : ""}`,
          })
          .addFields({
            name: "🧱 What Are You Working On?",
            value: `> *Create a* <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> *post for a project you're working on. 50 points per post.*\n> **${
              response.pointsWhatAreYouWorkingOn
            }/150 points** ${
              response.pointsWhatAreYouWorkingOn === 150 ? "✅" : ""
            }`,
          })
          .addFields({
            name: "💬 Feedback Fiend",
            value: `> *Comment on* <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> *posts. 1 point per comment.*\n> **${
              response.pointsFeedbackFiend
            }/100 points** ${response.pointsFeedbackFiend === 100 ? "✅" : ""}`,
          });
        if (response.linkedGamertag) {
          progressEmbed
            .addFields({
              name: "🥾 Gone Hiking",
              value: `> *Attend Pathfinder Hikes playtesting in-game! 10 points per map hiked.*\n> **${
                response.pointsGoneHiking
              }/250 points** ${response.pointsGoneHiking === 250 ? "✅" : ""}`,
            })
            .addFields({
              name: "🔥 Forged in Fire",
              value: `> *Spend time playing Custom Games on maps made on Forge canvases. 1 point per full hour played.*\n> **${
                response.pointsForgedInFire
              }/100 points** ${
                response.pointsForgedInFire === 100 ? "✅" : ""
              }`,
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
          name: "Your Total Pathfinder Dynamo Points",
          value: `> **${response.totalPoints}/500 points** ${
            response.totalPoints >= 500 ? "✅" : ""
          }\n`,
        })
        .setFooter({
          text: "Pathfinder Dynamo Progress",
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
        const promotionRoleId = ERA_DATA[currentEra].dynamoRole;
        // Only promote if the user does not already have the role
        if (!interaction.member.roles.cache.has(promotionRoleId)) {
          await interaction.member.roles.add(promotionRoleId);
          const channel = interaction.client.channels.cache.get(
            HALOFUNTIME_ID_CHANNEL_SPOTLIGHT
          );
          const pathfinderPromotionMessage = await channel.send(
            `<@${interaction.user.id}> checked their challenge progress in <#${HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS}> and just earned the <@&${promotionRoleId}> role!`
          );
          await pathfinderPromotionMessage.react("🎉");
          await pathfinderPromotionMessage.react(
            HALOFUNTIME_ID_EMOJI_HEART_PATHFINDERS
          );
          await pathfinderPromotionMessage.react("🫘");
        }
      }
    }
  },
};
