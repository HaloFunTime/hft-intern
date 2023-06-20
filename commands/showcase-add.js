const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const CHOICE_MAP = "map";
const CHOICE_MODE = "mode";
const CHOICE_PREFAB = "prefab";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("showcase-add")
    .setDescription("Add a file to your Showcase")
    .addStringOption((option) =>
      option
        .setName("file_type")
        .setDescription("The type of Halo Infinite file to add")
        .setRequired(true)
        .addChoices(
          { name: "Map", value: CHOICE_MAP },
          { name: "Mode", value: CHOICE_MODE },
          { name: "Prefab", value: CHOICE_PREFAB }
        )
    )
    .addStringOption((option) =>
      option
        .setName("file_id")
        .setDescription("A valid Halo Infinite file ID")
        .setMaxLength(36)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const fileType = interaction.options.getString("file_type");
    const fileId = interaction.options.getString("file_id");
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/showcase/add-file`,
        {
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
          fileType: fileType,
          fileId: fileId,
        },
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
    if ("error" in response) {
      let friendlyErrorMessage = "";
      const responseDetail = response.error?.details?.detail;
      console.error(responseDetail);
      if (
        responseDetail ===
        "Must have a verified linked gamertag to add to a Showcase."
      ) {
        friendlyErrorMessage =
          "You must have a verified linked gamertag to add files to your Showcase.";
      } else if (responseDetail === "Showcase already has 5 files.") {
        friendlyErrorMessage =
          "Your Showcase already has 5 files. Remove a file with `/showcase-remove` if you wish to add this file.";
      } else if (
        responseDetail ===
        `Cannot find a Halo Infinite ${fileType} file with the specified ID.`
      ) {
        friendlyErrorMessage =
          "We could not find a file with that ID. Make sure it is typed correctly and the file is published in-game.";
      } else if (
        responseDetail ===
        "Submitter must be a contributor to add to a Showcase."
      ) {
        friendlyErrorMessage =
          "You must be listed as a contributor to this file to add it to your Showcase.";
      } else if (responseDetail === "File already in Showcase.") {
        friendlyErrorMessage = "This file is already in your Showcase.";
      } else {
        friendlyErrorMessage = `We couldn't add that ${fileType} to your Showcase at this time. Sorry about that.`;
      }
      await interaction.reply({
        content: friendlyErrorMessage,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `You successfully added this ${fileType} to your Showcase!`,
        ephemeral: true,
      });
    }
  },
};
