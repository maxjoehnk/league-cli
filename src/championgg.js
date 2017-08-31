const fetch = require('node-fetch');

const champion = async (key, id) => {
    const url = `http://api.champion.gg/v2/champions/${id}?champData=hashes&api_key=${key}`;
    const res = await fetch(url);
    const [result] = await res.json();
    return result;
}

module.exports = {
    champion
};
