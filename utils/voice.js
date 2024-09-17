async function listMembersConnectedToVC(client, guildId, channelId) {
  try {
    let guild = client.guilds.cache.get(guildId);
    let voiceChannel = await guild.channels.fetch(channelId, { force: true });

    return voiceChannel.members;
  } catch (error) {
    logger.error(
      `Error listing members connected to VC ${channelId} in server ${guildId}:`
    );
    console.log(error);
  }
}

module.exports = {
  listMembersConnectedToVC: listMembersConnectedToVC,
};
