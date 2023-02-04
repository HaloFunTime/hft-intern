const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");

dayjs.extend(utc);
dayjs.extend(timezone);

const createTrailblazerTuesdayEvent = async (client) => {
  const now = dayjs();
  const nextTuesday = now.day(2).add(1, "week");
  const eventStart = dayjs.tz(
    `${nextTuesday.format("YYYY-MM-DD")} 17:00:00`,
    "America/Denver"
  );
  try {
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
      `<@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}>\n\nTrailblazer Tuesday - our weekly practice and learning session - has been scheduled for next week.\n\nClick the \"Interested\" bell below to get notified when it starts. All skill levels are welcome as long as you have the desire to improve!`,
      "Trailblazer Tuesday",
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
      eventStart.toISOString(),
      "Lesson TBD.",
      "https://i.imgur.com/HrEmKSC.jpg"
    );
    if (message) {
      await message.react("🌠");
      await message.react("📚");
      await message.react("🎥");
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  createTrailblazerTuesdayEvent: createTrailblazerTuesdayEvent,
};
