const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "seriesSelect",
  async process(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith("seriesSelect")) return;
    await interaction.deferUpdate();
    const selectedRulesetId = interaction.values[0];
    // NOTE: Each seriesUrl is a max of 36 characters
    const bestOfs = [
      { title: "Best of 3", seriesUrl: `${selectedRulesetId}/bo3` },
      { title: "Best of 5", seriesUrl: `${selectedRulesetId}/bo5` },
      { title: "Best of 7", seriesUrl: `${selectedRulesetId}/bo7` },
    ];
    // NOTE: The customId should at most be 12 + 1 + 19 + 1 + 36 = 69 characters, 31 under Discord's limit
    const row = new ActionRowBuilder().addComponents(
      bestOfs.map((bestOf) => {
        return new ButtonBuilder()
          .setCustomId(
            `seriesButton:${interaction.user.id}:${bestOf.seriesUrl}`
          )
          .setLabel(bestOf.title)
          .setStyle(ButtonStyle.Primary);
      })
    );
    await interaction.update({
      content: "",
      components: [row],
    });
  },
};
