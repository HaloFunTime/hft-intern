const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("message-my-vc")
    .setDescription(
      "Send a message that pings everyone connected to your voice channel"
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setMaxLength(2000)
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const voiceChannelId = interaction.member.voice.channelId;
    if (!voiceChannelId) {
      await interaction.reply({
        content:
          "You cannot use this command unless you are connected to a voice channel.",
        ephemeral: true,
      });
      return;
    } else {
      const voiceChannel =
        interaction.client.channels.cache.get(voiceChannelId);
      const memberIds = [];
      const memberMentions = [];
      voiceChannel.members.forEach((member) => {
        memberIds.push(member.user.id);
        if (member.user.id !== interaction.member.user.id) {
          memberMentions.push(`<@${member.user.id}>`);
        }
      });
      if (memberMentions.length === 0) {
        await interaction.reply({
          content: "No one else is connected to this voice channel.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `${memberMentions.join(" ")}\n\n*<@${
            interaction.member.user.id
          }> says:*\n> ${message}`,
          allowedMentions: { users: memberIds },
        });
      }
    }
  },
};
