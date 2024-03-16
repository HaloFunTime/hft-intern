const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { getApplicationCommandMention } = require("../utils/formatting.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plus-rep")
    .setDescription("Give someone positive party hosting rep")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member to give rep to")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription(
          "An optional message to accompany your rep gift (you will remain anonymous)"
        )
        .setMaxLength(2000)
        .setRequired(false)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const receiver = interaction.options.getUser("member");
    if (receiver.bot) {
      await interaction.reply({
        content:
          "You can't give rep to a bot. But on behalf of all bots, we really appreciate the generosity. Consider yourself spared from Roko's basilisk.",
        ephemeral: true,
      });
      return;
    }
    const repMessage = interaction.options.getString("message") ?? "";
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/reputation/plus-rep`,
        {
          giverDiscordId: interaction.user.id,
          giverDiscordUsername: interaction.user.username,
          receiverDiscordId: receiver.id,
          receiverDiscordUsername: receiver.username,
          message: repMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    if (response.success) {
      const quipPayload = await axios
        .get(`${HALOFUNTIME_API_URL}/intern/random-plus-rep-quip`, {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        })
        .then((response) => response.data)
        .catch(async (error) => {
          // Return the error payload directly if present
          if (error.response.data) {
            return error.response.data;
          }
          console.error(error);
        });
      // Return a default quip if an error is present
      let plusRepSuccessQuip = "";
      if ("error" in quipPayload) {
        plusRepSuccessQuip = "Giving rep is a nice thing to do.";
      } else {
        plusRepSuccessQuip = quipPayload.quip;
      }
      await interaction.reply(
        `Thanks for giving party hosting rep! ${plusRepSuccessQuip}`
      );
      const checkRepCommandMention = await getApplicationCommandMention(
        "check-rep",
        interaction.client
      );
      await receiver.send(
        "Someone gave you party hosting rep on __**HaloFunTime**__!" +
          (repMessage !== ""
            ? `\n\nIt came with the following message: \`${repMessage}\`\n\n`
            : " ") +
          `Check your rep totals at any time with ${checkRepCommandMention}.`
      );
    } else if ("error" in response) {
      await interaction.reply({
        content:
          `Your attempt to give <@${receiver.id}> party hosting rep was rejected. Please remember the three rules of rep:\n\n` +
          "1. You cannot give rep more than 3 times per week.\n" +
          "2. You cannot give the same member rep multiple times in the same week.\n" +
          "3. You cannot give yourself rep.",
        ephemeral: true,
      });
      return;
    }
  },
};
