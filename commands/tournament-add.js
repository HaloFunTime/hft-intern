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
    .setName("tournament-add")
    .setDescription("Add the 'Tournament Competitor' role to a player")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription(
          "The player who you'd like to add the 'Tournament Competitor' role to"
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
        !playerMember.roles.cache.has(HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR)
      ) {
        await playerMember.roles.add(HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR);
        await interaction.reply({
          content: `Successfully added the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role to <@${playerMember.id}>.`,
          ephemeral: true,
        });
        const crewChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_CREW
        );
        await crewChannel.send({
          content: `<@${commandMember.id}> added the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role to <@${playerMember.id}>.`,
          allowedMentions: { users: [commandMember.id] },
        });
        const competitorsChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_COMPETITORS
        );
        const welcomeMessage = await competitorsChannel.send(
          `Welcome <@${playerMember.id}> to the tournament! Connect to the <#${HALOFUNTIME_ID_CHANNEL_NEW_TOURNEY_VC}> channel to create a VC for your team during the tournament, and use the <#${HALOFUNTIME_ID_CHANNEL_TOURNAMENT_HELP}> channel if you need any help.`
        );
        await welcomeMessage.react("👋");
      } else {
        interaction.reply({
          content: `<@${playerMember.id}> already has the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_COMPETITOR}> role. No action is needed.`,
          ephemeral: true,
        });
      }
    } else {
      interaction.reply({
        content: `Only members with the <@&${HALOFUNTIME_ID_ROLE_TOURNAMENT_CREW}> role can add players to a tournament.`,
        ephemeral: true,
      });
    }
  },
};
