const { SlashCommandBuilder } = require("discord.js");
const {
  HALOFUNTIME_ID_CHANNEL_COMPETITORS,
  HALOFUNTIME_ID_CHANNEL_CREW,
  HALOFUNTIME_ID_CHANNEL_TOURNAMENT_HELP,
  HALOFUNTIME_ID_CHANNEL_NEW_TOURNEY_VC,
  HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR,
  HALOFUNTIME_ID_ROLE_TOURNAMENT_CREW,
  HALOFUNTIME_ID,
} = require("../constants.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tournament-remove")
    .setDescription("Remove the 'Tournament Competitor' role from a player")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription(
          "The player who you'd like to remove the 'Tournament Competitor' role from"
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.guildId !== HALOFUNTIME_ID) {
      interaction.reply({
        content: "This command may only be run in the HaloFunTime server.",
        ephemeral: true,
      });
      return;
    }
    const player = interaction.options.getUser("player");
    const commandMember = interaction.member;
    const commandMemberIsCrew = commandMember.roles.cache.has(
      HALOFUNTIME_ID_ROLE_TOURNAMENT_CREW
    );
    if (commandMemberIsCrew) {
      const guild = interaction.client.guilds.cache.get(interaction.guildId);
      const playerMember = await guild.members.fetch(player.id);
      if (
        playerMember.roles.cache.has(HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR)
      ) {
        await playerMember.roles.remove(
          HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR
        );
        await interaction.reply({
          content: `Successfully removed the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role from <@${playerMember.id}>.`,
          ephemeral: true,
        });
        const crewChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_CREW
        );
        await crewChannel.send({
          content: `<@${commandMember.id}> removed the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role from <@${playerMember.id}>.`,
          allowedMentions: { users: [commandMember.id] },
        });
      } else {
        interaction.reply({
          content: `<@${playerMember.id}> does not have the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role. No action is needed.`,
          ephemeral: true,
        });
      }
    } else {
      interaction.reply({
        content: `Only members with the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_CREW}> role can remove players from a tournament.`,
        ephemeral: true,
      });
    }
  },
};
