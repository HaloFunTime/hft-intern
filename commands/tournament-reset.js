const { SlashCommandBuilder } = require("discord.js");
const {
  HALOFUNTIME_ID_CHANNEL_COMPETITORS,
  HALOFUNTIME_ID_CHANNEL_CREW,
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR,
  HALOFUNTIME_ID_ROLE_TOURNAMENT_CREW,
  HALOFUNTIME_ID,
} = require("../constants.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tournament-reset")
    .setDescription(
      "Remove the 'Tournament Competitor' role from all users who have it"
    )
    .addBooleanOption((option) =>
      option
        .setName("confirm")
        .setDescription("Set this to 'True' to actually reset the tournament")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (interaction.guildId !== HALOFUNTIME_ID) {
      interaction.reply({
        content: "This command may only be run in the HaloFunTime server.",
        ephemeral: true,
      });
      return;
    }
    const confirm = interaction.options.getBoolean("confirm") ?? false;
    const commandMember = interaction.member;
    const commandMemberIsStaff = commandMember.roles.cache.has(
      HALOFUNTIME_ID_ROLE_STAFF
    );
    if (commandMemberIsStaff) {
      if (confirm) {
        const guild = interaction.client.guilds.cache.get(interaction.guildId);
        const competitorRole = guild.roles.cache.get(
          HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR
        );
        const competitors = Array.from(competitorRole.members.values());
        for (const member of competitors) {
          await member.roles.remove(HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR);
        }
        await interaction.reply({
          content: "Successfully reset the tournament.",
          ephemeral: true,
        });
        const crewChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_CREW
        );
        await crewChannel.send({
          content: `<@${commandMember.id}> reset the tournament. The <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role has been removed from all players.`,
          allowedMentions: { users: [commandMember.id] },
        });
        const competitorsChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_COMPETITORS
        );
        await competitorsChannel.send({
          content: `<@${commandMember.id}> reset the tournament. The <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role has been removed from all players.`,
          allowedMentions: { users: [commandMember.id] },
        });
      } else {
        interaction.reply({
          content:
            "You must set `confirm` (an additional command option) to True to reset the tournament.",
          ephemeral: true,
        });
      }
    } else {
      interaction.reply({
        content: `Only members with the <@&${HALOFUNTIME_ID_ROLE_STAFF}> role can reset a tournament.`,
        ephemeral: true,
      });
    }
  },
};
