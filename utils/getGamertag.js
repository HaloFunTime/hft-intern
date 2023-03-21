const axios = require('axios');
const Discord = require("discord.js");

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
} 

async function getGamertagFromDiscordInteraction(interaction) {
    console.log(`Running getGamertagFromDiscordInteraction`)
    // console.log(`About to log the interaction passed into getGamertagFromDiscordInteraction`)
    // console.log(interaction)

    
    const HALOFUNTIME_API_KEY = process.env.HALOFUNTIME_API_KEY;
    const HALOFUNTIME_API_URL = process.env.HALOFUNTIME_API_URL;

    const target_discord_id = interaction.targetUser.id
    const target_discord_tag = interaction.targetUser.username + "#" + interaction.targetUser.discriminator

    const request_url = `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${target_discord_id}&discordTag=${encodeURIComponent(target_discord_tag)}`
    console.log(`The value of request_url is: ${request_url}`)

    try {
        const response = await axios.get(request_url, {
            headers: {
                Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
        });

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        // Return the error payload directly if present
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data,
            };
        }
        console.error("We failed to get a Gamertag for the user")
        console.error(error);
        return {
            success: false,
            message: 'An unexpected error occurred',
        };
    }
}

module.exports = getGamertagFromDiscordInteraction;