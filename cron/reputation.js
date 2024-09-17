const { ChannelType } = require("discord.js");
const { getApplicationCommandMention } = require("../utils/formatting.js");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { HALOFUNTIME_ID_CATEGORY_PLAY_HALO } = require("../constants.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const attemptRepNudges = async (client) => {
  const now = dayjs();
  const oneHourAgo = now.subtract(1, "hour");
  const oneHourAgoUnix = oneHourAgo.valueOf();
  const oneHourFiveMinutesAgoUnix = oneHourAgo.subtract(5, "minutes").valueOf();
  const plusRepMention = await getApplicationCommandMention("plus-rep", client);

  // Find all recent VCs in the "PLAY HALO" category created at least an hour ago
  const playHaloChildren = client.channels.cache.get(
    HALOFUNTIME_ID_CATEGORY_PLAY_HALO
  ).children.cache;
  const recentVCs = playHaloChildren.filter(
    (channel) =>
      channel.type === ChannelType.GuildVoice &&
      channel.createdTimestamp > oneHourFiveMinutesAgoUnix &&
      channel.createdTimestamp <= oneHourAgoUnix
  );

  // For each recent VC, ping with a rep nudge if players are present
  await recentVCs.forEach(async (vc) => {
    const userIds = [];
    const userMentions = [];
    vc.members.forEach((member) => {
      userIds.push(member.user.id);
      userMentions.push(`<@${member.user.id}>`);
    });
    if (userIds.length !== 0) {
      const nudgeMessage = `${userMentions.join(
        " "
      )}\n\nIf you're having a fun time, use ${plusRepMention} to thank your party host!`;
      await vc.send({
        content: nudgeMessage,
        allowedMentions: { users: userIds },
      });
    }
  });
};

module.exports = {
  attemptRepNudges: attemptRepNudges,
};
