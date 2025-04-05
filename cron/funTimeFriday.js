const { ChannelType, GuildScheduledEventStatus } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_GENERAL,
  HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC,
  HALOFUNTIME_ID_EMOJI_GRUNT_BIRTHDAY,
  HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM,
  HALOFUNTIME_ID_EMOJI_HFT_INTERESTED,
  HALOFUNTIME_ID_EMOJI_HFT_UPVOTE,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID,
  HALOFUNTIME_ID_CATEGORY_PLAY_HALO,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { listMembersConnectedToVC } = require("../utils/voice");

dayjs.extend(utc);
dayjs.extend(timezone);

const conditionalWednesdayPost = async (client) => {
  // Do not Wednesday post if the random roll fails
  if (Math.random() > 0.25) return;
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_GENERAL);
  await channel.send(
    "Don't forget to tag <@219572030859771904> and let him know whether you're coming to Fun Time Friday this week!"
  );
};

const createFunTimeFridayEvent = async (client) => {
  const now = dayjs();
  const thisFriday = now.day(5);
  const eventStart = dayjs.tz(
    `${thisFriday.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
  const thisSaturday = now.day(6);
  const eventEnd = dayjs.tz(
    `${thisSaturday.format("YYYY-MM-DD")} 06:00:00`,
    "America/Denver"
  );
  const ftfNumber =
    eventStart.diff(dayjs.tz("2022-11-11 18:00:00", "America/Denver"), "week") +
    1;
  const quips = [
    "is this week",
    "is nigh",
    "is near",
    "draws closer",
    "is just a few days away",
    "is HAPPENING",
    "cannot be stopped",
    "will knock your socks off",
    "will blow you away",
    "will be one for the books",
    "will be one to remember",
    "is on the horizon",
  ];
  const quip = quips[(quips.length * Math.random()) | 0];
  try {
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
      `<@&${HALOFUNTIME_ID_ROLE_MEMBER}> Fun Time Friday #${ftfNumber} ${quip}!\n\nWhen the event starts, connect to any voice channel in the __**PLAY HALO**__ section to join the fun - or create your own voice channel to start your own lobby.\n\nClick the \"Interested\" bell on the event if you'll be joining us this week!`,
      `Fun Time Friday #${ftfNumber}`,
      HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC,
      eventStart.toISOString(),
      eventEnd.toISOString(),
      "Join your party-up pals at HaloFunTime for an evening of custom games, matchmaking, and fun. Start a new VC or join an existing one to get in on the fun.",
      "https://i.imgur.com/g704sdo.jpg"
    );
    if (message) {
      const emojis = [
        HALOFUNTIME_ID_EMOJI_GRUNT_BIRTHDAY,
        HALOFUNTIME_ID_EMOJI_HFT_INTERESTED,
        HALOFUNTIME_ID_EMOJI_HFT_UPVOTE,
        HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM,
        "🎉",
        "🥳",
        "🎊",
      ];
      // Shuffle the emojis so reaction order is randomized
      for (let i = emojis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
      }
      // React with seven emojis
      for (const emoji of emojis) {
        await message.react(emoji);
      }
      await message.crosspost();
    }
  } catch (e) {
    console.error(e);
  }
};

const startFunTimeFridayEvent = async (client) => {
  // Get the correct ScheduledEvent for Fun Time Friday
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const events = guild.scheduledEvents.cache.filter(
    (scheduledEvent) =>
      scheduledEvent.name.includes("Fun Time Friday") &&
      scheduledEvent.isScheduled()
  );

  // Set its status to "Active"
  events.forEach(async (event) => {
    await event.setStatus(GuildScheduledEventStatus.Active);
  });
};

const endFunTimeFridayEvent = async (client) => {
  // Get the correct ScheduledEvent for Fun Time Friday
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const events = guild.scheduledEvents.cache.filter(
    (scheduledEvent) =>
      scheduledEvent.name.includes("Fun Time Friday") &&
      scheduledEvent.isActive()
  );

  // Set its status to "Completed"
  events.forEach(async (event) => {
    await event.setStatus(GuildScheduledEventStatus.Completed);
  });
};

const startFunTimeFriday = async (client) => {
  // Start Fun Time Friday by creating Voice Connect records for all people currently connected to PLAY HALO VCs.
  const now = dayjs();
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const channels = guild.channels.cache.filter(
    (channel) =>
      channel.parentId === HALOFUNTIME_ID_CATEGORY_PLAY_HALO &&
      channel.type === ChannelType.GuildVoice
  );
  for (const channel of channels) {
    const vcMembers = await listMembersConnectedToVC(
      client,
      guild.id,
      channel.id
    );
    if (!vcMembers) {
      console.error(
        `Failed to get members for channel ${channel.id} (${channel.name})`
      );
      continue;
    }
    if (vcMembers.size === 0) {
      continue;
    }
    for (const [id, member] of vcMembers.entries()) {
      if (member.user.bot) {
        continue;
      }
      const response = await axios
        .post(
          `${HALOFUNTIME_API_URL}/fun-time-friday/voice-connect`,
          {
            connectorDiscordId: member.user.id,
            connectorDiscordUsername: member.user.username,
            connectedAt: now.toISOString(),
            channelId: channel.id,
            channelName: channel.name,
          },
          {
            headers: {
              Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
          }
        )
        .then((response) => response.data)
        .catch(async (error) => {
          console.error(error);
          // Return the error payload directly if present
          if (error.response.data) {
            return error.response.data;
          }
        });
      // Log if an error happens
      if (response.success === false || "error" in response) {
        console.error(
          `API call failed for user ${member.user.username}:`,
          response.error
        );
      } else {
        console.log(
          `Successfully saved connect for ${member.user.username} in ${channel.name}`
        );
      }
    }
  }
};

const endFunTimeFriday = async (client) => {
  // End Fun Time Friday by creating Voice Disconnect records for all people currently connected to PLAY HALO VCs.
  const now = dayjs();
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const channels = guild.channels.cache.filter(
    (channel) =>
      channel.parentId === HALOFUNTIME_ID_CATEGORY_PLAY_HALO &&
      channel.type === ChannelType.GuildVoice
  );
  for (const channel of channels) {
    const vcMembers = await listMembersConnectedToVC(
      client,
      guild.id,
      channel.id
    );
    if (!vcMembers) {
      console.error(
        `Failed to get members for channel ${channel.id} (${channel.name})`
      );
      continue;
    }
    if (vcMembers.size === 0) {
      continue;
    }
    for (const [id, member] of vcMembers.entries()) {
      if (member.user.bot) {
        continue;
      }
      const response = await axios
        .post(
          `${HALOFUNTIME_API_URL}/fun-time-friday/voice-disconnect`,
          {
            disconnectorDiscordId: member.user.id,
            disconnectorDiscordUsername: member.user.username,
            disconnectedAt: now.toISOString(),
            channelId: channel.id,
            channelName: channel.name,
          },
          {
            headers: {
              Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
          }
        )
        .then((response) => response.data)
        .catch(async (error) => {
          console.error(error);
          // Return the error payload directly if present
          if (error.response.data) {
            return error.response.data;
          }
        });
      // Log if an error happens
      if (response.success === false || "error" in response) {
        console.error(
          `API call failed for user ${member.user.username}:`,
          response.error
        );
      } else {
        console.log(
          `Successfully saved disconnect for ${member.user.username} in ${channel.name}`
        );
      }
    }
  }
};

const publishFunTimeFridayReport = async (client) => {
  const now = dayjs();
  const thisFriday = now.day(5);
  const eventStart = dayjs.tz(
    `${thisFriday.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
  const ftfNumber =
    eventStart.diff(dayjs.tz("2022-11-11 18:00:00", "America/Denver"), "week") +
    1;
  const quips = [
    "has come to a close",
    "is over... finally",
    "is in the rearview mirror",
    "just finished, and boy am I tired",
    "is OVER",
    "brought the smoke",
    "was a success, with minimal casualties",
    "knocked many socks off",
    "blew us all away",
    "was one for the books",
    "was one to remember",
    "was quite a party",
  ];
  const quip = quips[(quips.length * Math.random()) | 0];
  function buildPartyTimePing(partyTimer) {
    const hours = Math.floor(partyTimer.seconds / 3600);
    const minutes = Math.floor((partyTimer.seconds - hours * 3600) / 60);
    const seconds = partyTimer.seconds - hours * 3600 - minutes * 60;
    const timeStrings = [];
    if (hours > 0) {
      timeStrings.push(`${hours}h`);
    }
    if (minutes > 0) {
      timeStrings.push(`${minutes}m`);
    }
    timeStrings.push(`${seconds}s`);
    return `<@${partyTimer.discordId}> (${timeStrings.join(" ")} in VC)`;
  }
  try {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const reportPayload = await axios
      .get(
        `${HALOFUNTIME_API_URL}/fun-time-friday/report?fridayDate=${thisFriday.format(
          "YYYY-MM-DD"
        )}`,
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
    // Return without trying to post the report if error data is present
    if ("error" in reportPayload) return;
    // Opener
    const openerText = `Fun Time Friday #${ftfNumber} ${quip}.`;
    // Stats
    const statsText =
      `**${reportPayload.totalPlayers} unique player${
        reportPayload.totalPlayers == 1 ? "" : "s"
      }** joined us to have a fun time, ` +
      `and they collectively spent **${reportPayload.totalHours} hour${
        reportPayload.totalHours == 1 ? "" : "s"
      }** in voice chat ` +
      `across **${reportPayload.totalChannels} unique voice channel${
        reportPayload.totalChannels == 1 ? "" : "s"
      }**.`;
    // Party Animals
    let partyAnimalNumber = 1;
    const partyAnimalLines = [];
    for (const partyAnimal of reportPayload.partyAnimals) {
      let emoji = "🎉";
      if (partyAnimalNumber === 1) {
        emoji = "🥇";
      } else if (partyAnimalNumber === 2) {
        emoji = "🥈";
      } else if (partyAnimalNumber === 3) {
        emoji = "🥉";
      }
      partyAnimalLines.push(`- ${emoji}: ${buildPartyTimePing(partyAnimal)}`);
      partyAnimalNumber++;
    }
    let partyAnimalsText =
      "No one partied hard enough this week to be considered a __**Party Animal**__.";
    if (partyAnimalLines.length > 0) {
      partyAnimalsText = `This week's __**Party Animals**__ partied harder than anyone else:\n${partyAnimalLines.join(
        "\n"
      )}`;
    }
    // Party Poopers
    const partyPooperLines = [];
    for (const partyPooper of reportPayload.partyPoopers) {
      partyPooperLines.push(`- 💩: ${buildPartyTimePing(partyPooper)}`);
    }
    let partyPoopersText =
      "No one partied poorly enough this week to be considered a __**Party Pooper**__.";
    if (partyPooperLines.length > 0) {
      partyPoopersText = `This week's __**Party Poopers**__ didn't party as hard as they could've:\n${partyPooperLines.join(
        "\n"
      )}`;
    }
    // Closer
    let closerText = "I guess I'm caring for an empty installation.";
    if (partyAnimalLines.length > 0 || partyPooperLines.length > 0) {
      closerText =
        "Party on, __**Party Animals**__! And to our __**Party Poopers**__... how about sticking around longer next week?";
    }
    // Send message and publish it
    const channel = client.channels.cache.get(
      HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
    );
    const message = await channel.send(
      `${openerText}\n\n${statsText}\n\n${partyAnimalsText}\n\n${partyPoopersText}\n\n${closerText}`
    );
    if (message) {
      await message.crosspost();
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  conditionalWednesdayPost: conditionalWednesdayPost,
  createFunTimeFridayEvent: createFunTimeFridayEvent,
  endFunTimeFriday: endFunTimeFriday,
  endFunTimeFridayEvent: endFunTimeFridayEvent,
  publishFunTimeFridayReport: publishFunTimeFridayReport,
  startFunTimeFriday: startFunTimeFriday,
  startFunTimeFridayEvent: startFunTimeFridayEvent,
};
