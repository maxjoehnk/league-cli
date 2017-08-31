const fetch = require('node-fetch');

const champions = async (api_key) => {
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/champions?api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        throw new Error(body.status.message);
    }
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
