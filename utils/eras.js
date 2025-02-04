const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E1,
  HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E2,
  HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E3,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E1,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E2,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E3,
} = require("../constants");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const ERA_01 = "era01";
const ERA_01_START_TIME = dayjs.tz("2024-01-30 11:00:00", "America/Denver");
const ERA_01_END_TIME = dayjs.tz("2024-05-28 11:00:00", "America/Denver");
const ERA_02 = "era02";
const ERA_02_START_TIME = dayjs.tz("2024-05-28 11:00:00", "America/Denver");
const ERA_02_END_TIME = dayjs.tz("2025-02-04 11:00:00", "America/Denver");
const ERA_03 = "era03";
const ERA_03_START_TIME = dayjs.tz("2025-02-04 11:00:00", "America/Denver");
const ERA_03_END_TIME = dayjs.tz("2025-08-05 11:00:00", "America/Denver");
const ERA_04 = "era04";
const ERA_04_START_TIME = dayjs.tz("2025-08-05 11:00:00", "America/Denver");
const ERA_04_END_TIME = dayjs.tz("2026-02-03 11:00:00", "America/Denver");
const ERA_DATA = {
  [ERA_01]: {
    startTime: ERA_01_START_TIME,
    endTime: ERA_01_END_TIME,
    scoutRole: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E1,
    dynamoRole: HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E1,
  },
  [ERA_02]: {
    startTime: ERA_02_START_TIME,
    endTime: ERA_02_END_TIME,
    scoutRole: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E2,
    dynamoRole: HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E2,
  },
  [ERA_03]: {
    startTime: ERA_03_START_TIME,
    endTime: ERA_03_END_TIME,
    scoutRole: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_E3,
    dynamoRole: HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_E3,
  },
  [ERA_04]: {
    startTime: ERA_04_START_TIME,
    endTime: ERA_04_END_TIME,
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
