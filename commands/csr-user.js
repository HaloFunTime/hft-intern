const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} = require("discord.js");
const getCSR = require("../utils/getCSR");
const getGamertagFromDiscordInteraction = require("../utils/getGamertag");
const buildRankEmbeds = require("../utils/buildRankEmbeds");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Get User's CSR")
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    console.log(
      "Running \"Get User's CSR\" as a UserCommand. Attempting to lookup gamertag."
    );

    try {
      const gamertag_response = await getGamertagFromDiscordInteraction(
        interaction
      );
      // console.log(`The value of gamertag_response is:`)
      // console.log(gamertag_response)
      if (gamertag_response.message?.error == "Not found.") {
        await interaction.reply({
          content:
            `<@${interaction.targetUser.id}> hasn't linked a gamertag on HaloFunTime. ` +
            "They can use `/link-gamertag` at any time to do so.",
          ephemeral: true,
        });
        return;
      }

      const gamertag = gamertag_response.data.xboxLiveGamertag;
      console.log(`The value of gamertag is: ${gamertag}`);

      console.log("csr-user.js - About to set const: csr_response ");
      const csr_response = await getCSR(gamertag);

      if (csr_response.error) {
        await interaction.reply({
          content: "There was an error retrieving the rank for the gamertag associated to this user",
          ephemeral: true,
        });
        return;
      }

      let response_embeds = [];

      if ("error" in csr_response) {
        // console.log(`csr-user.js - Attempting to check for an error in the csr_response`)
        if (csr_response.error.details?.detail) {
          await interaction.reply({
            content: csr_response.error.details.detail,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `An unknown error occurred while attempting to fetch CSR data for \`${gamertag}\`.`,
            ephemeral: true,
          });
        }
      } else {
        // console.log(`csr-user.js - No error in csr_response. Attempting to set response_embeds to result of buildRankEmbeds`)
        response_embeds = buildRankEmbeds(csr_response);
      }

      //   console.log(`csr-user.js - About to log value of response_embeds:`)
      //   console.log(response_embeds)

      await interaction.reply({
        embeds: response_embeds,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "An error occurred while processing your request as a Discord user command",
        ephemeral: true,
      });
    }
  },
};
