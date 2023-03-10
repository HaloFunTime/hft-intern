const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const getDateTimeForPathfinderEventStart = (dayjsDate) => {
  return dayjs.tz(
    `${dayjsDate.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
};

module.exports = {
  getDateTimeForPathfinderEventStart: getDateTimeForPathfinderEventStart,
};
