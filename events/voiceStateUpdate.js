async function joinedChannel(voiceState) {
  console.log(
    `${voiceState.guild?.name}: ${voiceState.member?.user?.tag} joined the ${voiceState.channel?.name} voice channel.`
  );
}

async function leftChannel(voiceState) {
  console.log(
    `${voiceState.guild?.name}: ${voiceState.member?.user?.tag} left the ${voiceState.channel?.name} voice channel.`
  );
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // Initial join: oldState has no channel, newState has channel
    if (!oldState.channel && newState.channel) {
      await joinedChannel(newState);
    }
    // Channel jump join: oldState has channel, newState has channel, both are different
    if (
      oldState.channel &&
      newState.channel &&
      oldState.channel !== newState.channel
    ) {
      await leftChannel(oldState);
      await joinedChannel(newState);
    }
    // Terminal leave: oldState has channel, newState has no channel
    if (oldState.channel && !newState.channel) {
      await leftChannel(oldState);
    }
  },
};
