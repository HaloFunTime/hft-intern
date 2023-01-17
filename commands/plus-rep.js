const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const plusRepSuccessQuips = [
  "Giving rep to great party hosts helps us reward the people who make our community great.",
  "It's considered polite in this community to reward great party hosts for a job well done.",
  "Make sure you always give plus rep to party hosts you enjoyed playing with!",
  "I know your rep message was supposed to be anonymous, but I read it and it brought a tear to my eye. So beautiful.",
  "Supporting our community by rewarding our best party hosts is how we prevent this place from degenerating into /r/halo. Keep it up!",
  "You can only give rep to the same person once a week, but if they're just as awesome next week, make sure to give them rep then too!",
  "You can only give rep three times per week. Make each one count!",
  "The weekly `/plus-rep` cooldowns are reset on Tuesdays. I'll announce it when it happens.",
  "Rep disappears one year after it's given, so keep giving rep to your favorite hosts!",
  "You can check anyone's rep with the `/check-rep` command.",
  "You can force me to post the current rep leaderboard with the `/top-rep` command.",
];

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
          giverDiscordTag: interaction.user.tag,
          receiverDiscordId: receiver.id,
          receiverDiscordTag: receiver.tag,
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
      const plusRepSuccessQuip =
        plusRepSuccessQuips[(plusRepSuccessQuips.length * Math.random()) | 0];
      await interaction.reply(
        `Thanks for giving party hosting rep! ${plusRepSuccessQuip}`
      );
      await receiver.send(
        "Someone gave you party hosting rep on __**HaloFunTime**__!" +
          (repMessage !== ""
            ? `\n\nIt came with the following message: \`${repMessage}\`\n\n`
            : " ") +
          "Check your rep totals at any time with the `/check-rep` command."
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
