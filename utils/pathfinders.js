const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const MAX_PLAYER_COUNT_CHOICE_SMALL = "4 players";
const MAX_PLAYER_COUNT_CHOICE_MEDIUM = "8 players";
const MAX_PLAYER_COUNT_CHOICE_LARGE = "16 players";
const MAX_PLAYER_COUNT_CHOICE_EXTRA_LARGE = "24 players";

const MAX_PLAYER_COUNT_CHOICES = [
  { name: "SM (4 players)", value: MAX_PLAYER_COUNT_CHOICE_SMALL },
  { name: "MD (8 players)", value: MAX_PLAYER_COUNT_CHOICE_MEDIUM },
  { name: "LG (16 players)", value: MAX_PLAYER_COUNT_CHOICE_LARGE },
  { name: "XL (24 players)", value: MAX_PLAYER_COUNT_CHOICE_EXTRA_LARGE },
];

const getDateTimeForPathfinderEventStart = (dayjsDate) => {
  return dayjs.tz(
    `${dayjsDate.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
};

module.exports = {
  getDateTimeForPathfinderEventStart: getDateTimeForPathfinderEventStart,
  MAX_PLAYER_COUNT_CHOICES: MAX_PLAYER_COUNT_CHOICES,
};
