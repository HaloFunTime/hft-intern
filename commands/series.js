const {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const axios = require("axios");
const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("series")
    .setDescription(
      "Generate a randomized series of maps and modes for a chosen ruleset"
    ),
  async execute(interaction) {
    const seriesRulesets = await axios
      .get(`${HALOFUNTIME_API_URL}/series/`, {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error(error);
      });
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`seriesSelect:${interaction.user.id}`)
        .setPlaceholder("Choose a ruleset")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          seriesRulesets.map((seriesRuleset) => {
            return {
              label: seriesRuleset.name,
              value: seriesRuleset.id,
            };
          })
        )
    );
    await interaction.reply({
      content: "",
      components: [row],
    });
  },
};
