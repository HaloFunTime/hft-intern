const { EmbedBuilder } = require("discord.js");

const LETTER_TO_HFT_EMOJI = {
  A: "<:hft_A:1116412496841015397>",
  B: "<:hft_B:1116412499600867460>",
  C: "<:hft_C:1116412632178634822>",
  D: "<:hft_D:1116412503493181461>",
  E: "<:hft_E:1116412505112199229>",
  F: "<:hft_F:1116412669277245551>",
  G: "<:hft_G:1116412508132102185>",
  H: "<:hft_H:1116412704425529344>",
  I: "<:hft_I:1116412513156878346>",
  J: "<:hft_J:1116412738873339984>",
  K: "<:hft_K:1116412517825122414>",
  L: "<:hft_L:1116412518789828610>",
  M: "<:hft_M:1116412778027163708>",
  N: "<:hft_N:1116412818632224922>",
  O: "<:hft_O:1116412522401108048>",
  P: "<:hft_P:1116412845421236236>",
  Q: "<:hft_Q:1116412525580406794>",
  R: "<:hft_R:1116412878593986560>",
  S: "<:hft_S:1116412894964367493>",
  T: "<:hft_T:1116412924588728344>",
  U: "<:hft_U:1116412530424827989>",
  V: "<:hft_V:1116412962912080064>",
  W: "<:hft_W:1116412534547824781>",
  X: "<:hft_X:1116413032055177408>",
  Y: "<:hft_Y:1116412537177636955>",
  Z: "<:hft_Z:1116413033217003590>",
};

const LETTER_TO_EMOJI = {
  A: "🇦",
  B: "🇧",
  C: "🇨",
  D: "🇩",
  E: "🇪",
  F: "🇫",
  G: "🇬",
  H: "🇭",
  I: "🇮",
  J: "🇯",
  K: "🇰",
  L: "🇱",
  M: "🇲",
  N: "🇳",
  O: "🇴",
  P: "🇵",
  Q: "🇶",
  R: "🇷",
  S: "🇸",
  T: "🇹",
  U: "🇺",
  V: "🇻",
  W: "🇼",
  X: "🇽",
  Y: "🇾",
  Z: "🇿",
};

const scoreBingo = (boardOrder, lettersCompleted) => {
  let bingoCount = 0;
  // 1st Row
  if (
    lettersCompleted.includes(boardOrder[0]) &&
    lettersCompleted.includes(boardOrder[1]) &&
    lettersCompleted.includes(boardOrder[2]) &&
    lettersCompleted.includes(boardOrder[3]) &&
    lettersCompleted.includes(boardOrder[4])
  ) {
    bingoCount += 1;
  }
  // 2nd Row
  if (
    lettersCompleted.includes(boardOrder[5]) &&
    lettersCompleted.includes(boardOrder[6]) &&
    lettersCompleted.includes(boardOrder[7]) &&
    lettersCompleted.includes(boardOrder[8]) &&
    lettersCompleted.includes(boardOrder[9])
  ) {
    bingoCount += 1;
  }
  // 3rd Row
  if (
    lettersCompleted.includes(boardOrder[10]) &&
    lettersCompleted.includes(boardOrder[11]) &&
    lettersCompleted.includes(boardOrder[12]) &&
    lettersCompleted.includes(boardOrder[13]) &&
    lettersCompleted.includes(boardOrder[14])
  ) {
    bingoCount += 1;
  }
  // 4th Row
  if (
    lettersCompleted.includes(boardOrder[15]) &&
    lettersCompleted.includes(boardOrder[16]) &&
    lettersCompleted.includes(boardOrder[17]) &&
    lettersCompleted.includes(boardOrder[18]) &&
    lettersCompleted.includes(boardOrder[19])
  ) {
    bingoCount += 1;
  }
  // 5th Row
  if (
    lettersCompleted.includes(boardOrder[20]) &&
    lettersCompleted.includes(boardOrder[21]) &&
    lettersCompleted.includes(boardOrder[22]) &&
    lettersCompleted.includes(boardOrder[23]) &&
    lettersCompleted.includes(boardOrder[24])
  ) {
    bingoCount += 1;
  }
  // 1st Column
  if (
    lettersCompleted.includes(boardOrder[0]) &&
    lettersCompleted.includes(boardOrder[5]) &&
    lettersCompleted.includes(boardOrder[10]) &&
    lettersCompleted.includes(boardOrder[15]) &&
    lettersCompleted.includes(boardOrder[20])
  ) {
    bingoCount += 1;
  }
  // 2nd Column
  if (
    lettersCompleted.includes(boardOrder[1]) &&
    lettersCompleted.includes(boardOrder[6]) &&
    lettersCompleted.includes(boardOrder[11]) &&
    lettersCompleted.includes(boardOrder[16]) &&
    lettersCompleted.includes(boardOrder[21])
  ) {
    bingoCount += 1;
  }
  // 3rd Column
  if (
    lettersCompleted.includes(boardOrder[2]) &&
    lettersCompleted.includes(boardOrder[7]) &&
    lettersCompleted.includes(boardOrder[12]) &&
    lettersCompleted.includes(boardOrder[17]) &&
    lettersCompleted.includes(boardOrder[22])
  ) {
    bingoCount += 1;
  }
  // 4th Column
  if (
    lettersCompleted.includes(boardOrder[3]) &&
    lettersCompleted.includes(boardOrder[8]) &&
    lettersCompleted.includes(boardOrder[13]) &&
    lettersCompleted.includes(boardOrder[18]) &&
    lettersCompleted.includes(boardOrder[23])
  ) {
    bingoCount += 1;
  }
  // 5th Column
  if (
    lettersCompleted.includes(boardOrder[4]) &&
    lettersCompleted.includes(boardOrder[9]) &&
    lettersCompleted.includes(boardOrder[14]) &&
    lettersCompleted.includes(boardOrder[19]) &&
    lettersCompleted.includes(boardOrder[24])
  ) {
    bingoCount += 1;
  }
  // Diagonal 1
  if (
    lettersCompleted.includes(boardOrder[0]) &&
    lettersCompleted.includes(boardOrder[6]) &&
    lettersCompleted.includes(boardOrder[12]) &&
    lettersCompleted.includes(boardOrder[18]) &&
    lettersCompleted.includes(boardOrder[24])
  ) {
    bingoCount += 1;
  }
  // Diagonal 2
  if (
    lettersCompleted.includes(boardOrder[4]) &&
    lettersCompleted.includes(boardOrder[8]) &&
    lettersCompleted.includes(boardOrder[12]) &&
    lettersCompleted.includes(boardOrder[16]) &&
    lettersCompleted.includes(boardOrder[20])
  ) {
    bingoCount += 1;
  }
  return bingoCount;
};

const generateBingoCardEmbed = async (userId, boardOrder, lettersCompleted) => {
  let description = `*<@${userId}>'s Progress*\n\n`;
  for (let i = 0; i < boardOrder.length; i++) {
    if (i % 5 === 0) {
      description += "> ";
    }
    description += lettersCompleted.includes(boardOrder[i])
      ? "✅"
      : LETTER_TO_HFT_EMOJI[boardOrder[i]];
    description += " ";
    if (i % 5 === 4) {
      description += "\n";
    }
  }
  const bingoCount = scoreBingo(boardOrder, lettersCompleted);
  const boardEmbed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("Season 6 Bingo Card")
    .setDescription(description)
    .addFields({
      name: "Challenge Scores",
      value:
        `> **${bingoCount}/3 bingos** ${bingoCount >= 3 ? "✅" : ""}\n` +
        `> **${lettersCompleted.length}/25 squares** ${
          lettersCompleted.length >= 25 ? "✅" : ""
        }`,
    })
    .setFooter({
      text: "HaloFunTime Bingo Challenge",
      iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
    })
    .setTimestamp();
  return boardEmbed;
};

module.exports = {
  generateBingoCardEmbed: generateBingoCardEmbed,
  scoreBingo: scoreBingo,
  LETTER_TO_EMOJI: LETTER_TO_EMOJI,
  LETTER_TO_HFT_EMOJI: LETTER_TO_HFT_EMOJI,
};
