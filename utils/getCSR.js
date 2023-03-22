const axios = require("axios");

async function getCSR(xboxLiveGamertag) {
    console.log("Running getCSR function")
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    
    try {
        console.log(`getCSR - Making GET request to /halo-infinite/csr?gamertag with ${xboxLiveGamertag}`)
        const response = await axios.get(
        `${HALOFUNTIME_API_URL}/halo-infinite/csr?gamertag=${encodeURIComponent(xboxLiveGamertag)}`,
        {
            headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
        }
        );
        // console.log(`About to log value of "response"`)
        // console.log(response)
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
        return error.response.data;
        } else {
        console.error(error);
        throw new Error("An unknown error occurred while fetching CSR data.");
        }
    }
}

module.exports = getCSR;