const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tier-something")
    .setDescription(
      "Generate a message with reactions for S, A, B, C, and D tiers"
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Thing to tier (text)")
        .setMaxLength(2000)
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const replyMessage = await interaction.reply({
      content: `**React with a Tier:**\n> ${message}`,
      fetchReply: true,
    });
    await replyMessage.react("🇸");
    await replyMessage.react("🇦");
    await replyMessage.react("🇧");
    await replyMessage.react("🇨");
    await replyMessage.react("🇩");
  },
};
