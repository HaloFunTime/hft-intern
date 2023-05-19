const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const CATEGORY_CHOICE_DOUBLES = "Doubles";
const CATEGORY_CHOICE_ARENA = "Arena";
const CATEGORY_CHOICE_BTB = "BTB";
const CATEGORY_CHOICE_INFECTION = "Infection";
const CATEGORY_CHOICE_RACE = "Race";
const CATEGORY_CHOICE_MINIGAME = "Minigame";

const CATEGORY_CHOICES = [
  { name: "Doubles (2v2)", value: CATEGORY_CHOICE_DOUBLES },
  { name: "Arena (4v4)", value: CATEGORY_CHOICE_ARENA },
  { name: "BTB (12v12)", value: CATEGORY_CHOICE_BTB },
  { name: "Infection", value: CATEGORY_CHOICE_INFECTION },
  { name: "Minigame", value: CATEGORY_CHOICE_MINIGAME },
  { name: "Race", value: CATEGORY_CHOICE_RACE },
];

const getDateTimeForPathfinderEventStart = (dayjsDate) => {
  return dayjs.tz(
    `${dayjsDate.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
};

module.exports = {
  getDateTimeForPathfinderEventStart: getDateTimeForPathfinderEventStart,
  CATEGORY_CHOICES: CATEGORY_CHOICES,
};
