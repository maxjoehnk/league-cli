const fetch = require('node-fetch');
const d = require('debug')('league:riot');

const champions = async (api_key) => {
    d('Fetching all Champions');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/champions?api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', res);
        throw new Error(body.status.message);
    }
    d(`Received ${Object.getOwnPropertyNames(body.data).length} Champions`);
    return body.data;
};

const championId = (champions, name) => {
    const { id } = Object.getOwnPropertyNames(champions)
        .map(name => champions[name])
        .find(champ => champ.name === name);
    return id;
};

module.exports = {
    champions,
    championId
};
