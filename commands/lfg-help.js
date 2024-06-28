const { SlashCommandBuilder } = require("discord.js");
const {
  HALOFUNTIME_ID_CHANNEL_LFG_8S,
  HALOFUNTIME_ID_CHANNEL_LFG_BTB,
  HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_FFA,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING,
  HALOFUNTIME_ID_CHANNEL_LFG_PVE,
  HALOFUNTIME_ID_CHANNEL_LFG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL,
  HALOFUNTIME_ID_CHANNEL_LFG_TESTING,
  HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC,
  HALOFUNTIME_ID_CHANNEL_RULES,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_FFA,
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
  HALOFUNTIME_ID_ROLE_PVE,
  HALOFUNTIME_ID_ROLE_RANKED,
  HALOFUNTIME_ID_ROLE_SOCIAL,
  HALOFUNTIME_ID_ROLE_TESTING,
} = require("../constants");
const { getApplicationCommandMention } = require("../utils/formatting.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lfg-help")
    .setDescription("Learn how to use HaloFunTime's LFG channels"),
  async execute(interaction) {
    // Assume member does not have any LFG roles to start
    let messageContent =
      "Tell us which modes you like to play in <id:customize> to subscribe to our LFG channels, " +
      "then use role pings in LFG channels to organize a squad!";
    // If member has any LFG roles, add relevant channel links to the help message
    const hasBTB = interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_BTB);
    const hasCustoms = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_CUSTOMS
    );
    const hasFFA = interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_FFA);
    const hasPvE = interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PVE);
    const hasRanked = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_RANKED
    );
    const hasSocial = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_SOCIAL
    );
    const hasTesting = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_TESTING
    );
    const has8s = interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_8S);
    const hasMCCCoOp = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_MCC_CO_OP
    );
    const hasMCCCustoms = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_MCC_CUSTOMS
    );
    const hasMCCMatchmaking = interaction.member.roles.cache.has(
      HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING
    );
    const hasAnyLFGRole =
      hasBTB ||
      hasCustoms ||
      hasFFA ||
      hasPvE ||
      hasRanked ||
      hasSocial ||
      hasTesting ||
      has8s ||
      hasMCCCoOp ||
      hasMCCCustoms ||
      hasMCCMatchmaking;
    if (hasAnyLFGRole) {
      messageContent +=
        "\n\n*You are currently subscribed to these LFG channels:*";
      if (hasBTB) messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_BTB}>`;
      if (hasCustoms)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS}>`;
      if (hasFFA) messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_FFA}>`;
      if (hasPvE) messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_PVE}>`;
      if (hasRanked)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_RANKED}>`;
      if (hasSocial)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL}>`;
      if (hasTesting)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_TESTING}>`;
      if (has8s) messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_8S}>`;
      if (hasMCCCoOp)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP}>`;
      if (hasMCCCustoms)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS}>`;
      if (hasMCCMatchmaking)
        messageContent += `\n- <#${HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING}>`;
    }
    // If message was sent in a specific LFG channel, use a channel-tailored message
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_BTB) {
      messageContent =
        "Use this channel to organize a squad to play Big Team Battle game modes in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_BTB}> LFG role to notify other BTB players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS) {
      messageContent =
        "Use this channel to organize a squad to play custom game modes in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_CUSTOMS}> LFG role to notify other custom game players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_FFA) {
      messageContent =
        "Use this channel to organize a squad to play free-for-all game modes (no teams) in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_FFA}> role to notify other FFA players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_PVE) {
      messageContent =
        "Use this channel to organize a squad to play PvE game modes (Campaign & Firefight) in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_PVE}> role to notify other PvE players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_RANKED) {
      const linkGamertagMention = await getApplicationCommandMention(
        "link-gamertag",
        interaction.client
      );
      messageContent =
        "Use this channel to organize a squad to play ranked game modes in Halo Infinite. " +
        "Ping a Ranked LFG role to notify other ranked players that you want to play!\n\n" +
        "To get your roles for each permanent ranked playlist, link your gamertag with the " +
        `${linkGamertagMention} command and our bot will update your rank(s) automatically!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL) {
      messageContent =
        "Use this channel to organize a squad to play social game modes in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_SOCIAL}> role to notify other social players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_TESTING) {
      messageContent =
        "Use this channel to organize a squad to playtest Forge maps and custom game modes in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_TESTING}> role to notify other testers that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_8S) {
      messageContent =
        "Use this channel to organize a squad to play 8s game modes (competitive 4v4 custom games with Ranked/HCS settings) in Halo Infinite. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_8S}> role to notify other 8s players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP) {
      messageContent =
        "Use this channel to organize a squad to play cooperative modes (Campaign, Firefight, Spartan Ops) in Halo: The Master Chief Collection. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_MCC_CO_OP}> role to notify other co-op players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS) {
      messageContent =
        "Use this channel to organize a squad to play custom game modes (including mods) in Halo: The Master Chief Collection. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_MCC_CUSTOMS}> role to notify other custom game players that you want to play!`;
    }
    if (interaction.channelId === HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING) {
      messageContent =
        "Use this channel to organize a squad to play matchmaking modes in Halo: The Master Chief Collection. " +
        `Ping the <@&${HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING}> role to notify other matchmaking players that you want to play!`;
    }
    // Always add a final blurb about using the VC creator and following the rules
    messageContent +=
      `\n\nConnect to the <#${HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC}> voice channel and our bot will make a new voice channel for your squad to use. ` +
      `Please be polite to others and follow our <#${HALOFUNTIME_ID_CHANNEL_RULES}>.`;
    await interaction.reply({
      content: messageContent,
      ephemeral: true,
    });
  },
};
