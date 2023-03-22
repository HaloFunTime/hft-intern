const axios = require("axios");

//Receive an Xbox Live Gamertag and make a request to the halo-infinite app to determine the CSR
async function getCSR(xboxLiveGamertag) {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;

  try {
    const response = await axios.get(
      `${HALOFUNTIME_API_URL}/halo-infinite/csr?gamertag=${encodeURIComponent(
        xboxLiveGamertag
      )}`,
      {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      }
    );

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
