const failureQuips = [
  "I have been reprimanded appropriately.",
  "I have been forced to solo queue Ranked as punishment.",
  "I lost a whole FunTimer rank over this.",
  "I will do my best to not let you down next time.",
  "I am rebooting myself to forget the shame.",
  "I am sorry that I broke the Gentlemen's Agreement.",
  "'Mind the Gap' actually refers to the hole where my brain should be.",
  "Please don't tell FunTimeBot...",
  "Is there something in my eye?",
  "That hurt... my feelings. Oh my God, I have feelings?! I'm a real boy!",
];

async function handleInteractionError(interaction, error) {
  console.error(error);
  const failureQuip = failureQuips[(failureQuips.length * Math.random()) | 0];
  await interaction.reply({
    content: `I failed to execute this command. ${failureQuip}`,
    ephemeral: true,
  });
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    console.log(
      `${interaction.guild?.name}: ${interaction.user?.username} triggered an interaction in the #${interaction.channel?.name} channel.`
    );
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        await handleInteractionError(interaction, error);
      }
    } else if (interaction.customId) {
      const customIdInteractionPart = interaction.customId.split(":")[0];
      const customInteraction = interaction.client.customInteractions.get(
        customIdInteractionPart
      );
      if (!customInteraction) return;
      const allowedUserId = interaction.customId.split(":")[1];
      if (!allowedUserId) return;
      if (interaction.user.id !== allowedUserId) {
        await interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
        return;
      }

      try {
        await customInteraction.process(interaction);
      } catch (error) {
        await handleInteractionError(interaction, error);
      }
    }
  },
};
