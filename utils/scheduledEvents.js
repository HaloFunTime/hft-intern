const { GuildScheduledEventEntityType } = require("discord.js");

const createVoiceEvent = async (
  client,
  guildId,
  announcementChannelId,
  announcementMessage,
  eventName,
  eventVoiceChannelId,
  eventStartTimeISO,
  eventDescription,
  eventImage
) => {
  const guild = client.guilds.cache.get(guildId);
  console.log(`${guild.name}: Creating event \"${eventName}\".`);
  const existingEventsMap = await guild.scheduledEvents.fetch({
    cache: true,
    withUserCount: true,
  });
  const existingEvents = Array.from(existingEventsMap.values());
  const eventAlreadyExistsAtTimeInChannel =
    existingEvents.filter(
      (e) =>
        e.scheduledStartTimestamp === Date.parse(eventStartTimeISO) &&
        e.channelId === eventVoiceChannelId
    ).length > 0;
  if (eventAlreadyExistsAtTimeInChannel) {
    console.log(
      `${guild.name}: Skipped creation of event \"${eventName}\". An event already exists in channel ${eventVoiceChannelId} at ${eventStartTimeISO}.`
    );
    return;
  }
  const event = await guild.scheduledEvents.create({
    name: eventName,
    privacyLevel: 2,
    entityType: GuildScheduledEventEntityType.Voice,
    channel: eventVoiceChannelId,
    scheduledStartTime: eventStartTimeISO,
    description: eventDescription,
    image: eventImage,
  });
  console.log(`${guild.name}: Created event \"${eventName}\".`);
  const channel = client.channels.cache.get(announcementChannelId);
  const message = await channel.send(`${announcementMessage}\n${event.url}`);
  if (channel.type === "GUILD_NEWS") {
    await message.crosspost();
  }
  return message;
};

module.exports = { createVoiceEvent: createVoiceEvent };
