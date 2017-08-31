const fetch = require('node-fetch');
const d = require('debug')('league:riot');

const champions = async(db, api_key) => {
    if (await isCacheValid(db)) {
        return await championsFromCache(db);
    }else {
        const champions = await championsFromApi(api_key);
        await cacheChampions(db, champions);
        return champions;
    }
};

const championsFromApi = async api_key => {
    d('Fetching all Champions from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/champions?api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const champions = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${champions.length} Champions`);
    return champions.map(({ id, name }) => ({ id, name }));
};

const championsFromCache = async db => {
    d('Fetching all Champions from Cache');
    const champions = await db.select().from('champions');
    d(`Got ${champions.length} Champions`);
    return champions.map(({ name, riot_id }) => ({
        name,
        id: riot_id
    }));
};

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cache_identifier', 'riot_champions')
        .from('cache_control');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheChampions = async(db, champions) => {
    d('Dropping Champions Cache');
    await db.table('champions').del();
    d('Caching Campions');
    await db.insert(champions.map(({ name, id }) => ({
        name,
        riot_id: id
    }))).into('champions');
    d('Updating Cache Control');
    await db.table('cache_control')
        .where('cache_identifier', 'riot_champions')
        .del();
    await db.insert({
        cache_identifier: 'riot_champions',
        last_modified: new Date(),
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
    }).into('cache_control');
};

module.exports = {
    champions
};
