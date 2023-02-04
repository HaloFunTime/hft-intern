const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY,
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_WAITING_ROOM,
  HALOFUNTIME_ID_EMOJI_GRUNT_BIRTHDAY,
  HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM,
  HALOFUNTIME_ID_EMOJI_HFT_INTERESTED,
  HALOFUNTIME_ID_EMOJI_HFT_UPVOTE,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID,
} = require("../constants.js");
const categories = require("../utils/categories");
const scheduledEvents = require("../utils/scheduledEvents");

dayjs.extend(utc);
dayjs.extend(timezone);

const createFunTimeFridayEvent = async (client) => {
  const now = dayjs();
  const thisFriday = now.day(5);
  const eventStart = dayjs.tz(
    `${thisFriday.format("YYYY-MM-DD")} 17:00:00`,
    "America/Denver"
  );
  const thisSaturday = now.day(6);
  const eventEnd = dayjs.tz(
    `${thisSaturday.format("YYYY-MM-DD")} 05:00:00`,
    "America/Denver"
  );
  const ftfNumber =
    eventStart.diff(dayjs.tz("2022-11-11 17:00:00", "America/Denver"), "week") +
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
      `<@&${HALOFUNTIME_ID_ROLE_MEMBER}> Fun Time Friday #${ftfNumber} ${quip}!\n\nWhen the event starts, connect to any voice channel in the __**FUN TIME FRIDAY**__ section to join the fun - or create your own voice channel to start your own lobby.\n\nClick the \"Interested\" bell on the event if you'll be joining us this week!`,
      `Fun Time Friday #${ftfNumber}`,
      HALOFUNTIME_ID_CHANNEL_WAITING_ROOM,
      eventStart.toISOString(),
      eventEnd.toISOString(),
      "Join your party-up pals at HaloFunTime for an evening of custom games, matchmaking, and all sorts of other shenanigans.",
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
    }
  } catch (e) {
    console.error(e);
  }
};

const focusFunTimeFridayEvent = async (client) => {
  try {
    await categories.raiseAndOpenForRole(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY,
      HALOFUNTIME_ID_ROLE_MEMBER,
      "🎉 Fun Time Friday 🎉"
    );
    const category = client.channels.cache.get(
      HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY
    );
    const childChannelIds = category.children.cache.map(
      (channel) => channel.id
    );
    for (const channelId of childChannelIds) {
      const channel = client.channels.cache.get(channelId);
      channel.lockPermissions();
    }
  } catch (e) {
    console.error(e);
  }
};

const unfocusFunTimeFridayEvent = async (client) => {
  try {
    await categories.lowerAndCloseForRole(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY,
      HALOFUNTIME_ID_ROLE_MEMBER,
      "Fun Time Friday"
    );
    const category = client.channels.cache.get(
      HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY
    );
    const childChannelIds = category.children.cache.map(
      (channel) => channel.id
    );
    for (const channelId of childChannelIds) {
      const channel = client.channels.cache.get(channelId);
      channel.lockPermissions();
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  createFunTimeFridayEvent: createFunTimeFridayEvent,
  focusFunTimeFridayEvent: focusFunTimeFridayEvent,
  unfocusFunTimeFridayEvent: unfocusFunTimeFridayEvent,
};
