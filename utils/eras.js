const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const ERA_01 = "era01";
const ERA_01_START_TIME = dayjs.tz("2024-01-30 11:00:00", "America/Denver");
const ERA_01_END_TIME = dayjs.tz("2024-05-28 11:00:00", "America/Denver");
const ERA_DATA = {
  [ERA_01]: {
    startTime: ERA_01_START_TIME,
    endTime: ERA_01_END_TIME,
  },
};

const getCurrentEra = () => {
  const now = dayjs();
  for (const [eraId, eraObj] of Object.entries(ERA_DATA)) {
    if (now.isBetween(eraObj.startTime, eraObj.endTime)) {
      return eraId;
    }
  }
  return null;
};

module.exports = {
  getCurrentEra: getCurrentEra,
  ERA_DATA,
};
