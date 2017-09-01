const fetch = require('node-fetch');
const d = require('debug')('league:riot:runes');

const runes = async(db, api_key) => {
    if (await isCacheValid(db)) {
        return await runesFromCache(db);
    }else {
        const runes = await runesFromApi(api_key);
        await cacheRunes(db, runes);
        return runes;
    }
};

const runesFromApi = async api_key => {
    d('Fetching all Runes from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/runes?api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const runes = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${runes.length} Runes`);
    return runes.map(({ id, name, description }) => ({
        id,
        name,
        description
    }));
};

const runesFromCache = async db => {
    d('Fetching all Runes from Cache');
    const runes = await db.select().from('runes');
    d(`Got ${runes.length} Runes`);
    return runes.map(({ name, riot_id, description }) => ({
        name,
        id: riot_id,
        description
    }));
};

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cache_identifier', 'riot_runes')
        .from('cache_control');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheRunes = async(db, runes) => {
    d('Dropping Runes Cache');
    await db.table('runes').del();
    d('Caching Runes');
    await db.insert(runes.map(({ name, id, description }) => ({
        name,
        riot_id: id,
        description
    }))).into('runes');
    d('Updating Cache Control');
    await db.table('cache_control')
        .where('cache_identifier', 'riot_runes')
        .del();
    await db.insert({
        cache_identifier: 'riot_runes',
        last_modified: new Date(),
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
    }).into('cache_control');
};

module.exports = {
    runes
};
