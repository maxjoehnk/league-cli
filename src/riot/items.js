const fetch = require('node-fetch');
const d = require('debug')('league:riot:items');

const items = async(db, api_key) => {
    if (await isCacheValid(db)) {
        return await itemsFromCache(db);
    }else {
        const items = await itemsFromApi(api_key);
        await cacheItems(db, items);
        return items;
    }
};

const itemsFromApi = async api_key => {
    d('Fetching all Items from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/items?tags=all&api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const items = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${items.length} Items`);
    const imageBase = `http://ddragon.leagueoflegends.com/cdn/${body.version}/img`;
    return items.map(({ id, name, sanitizedDescription, image }) => ({
        id,
        name,
        description: sanitizedDescription,
        image_url: `${imageBase}/${image.group}/${image.full}`
    }));
};

const itemsFromCache = async db => {
    d('Fetching all Items from Cache');
    const items = await db.select().from('items');
    d(`Got ${items.length} Items`);
    return items.map(({ name, riot_id, description, image_url }) => ({
        name,
        id: riot_id,
        description,
        image_url
    }));
};

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cache_identifier', 'riot_items')
        .from('cache_control');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheItems= async(db, items) => {
    d('Dropping Items Cache');
    await db.table('items').del();
    d('Caching Items');
    await Promise.all(items.map(({ name, id, description, image_url }) => ({
        name,
        riot_id: id,
        description,
        image_url
    })).map(item => db.insert(item).into('items')));
    d('Updating Cache Control');
    await db.table('cache_control')
        .where('cache_identifier', 'riot_items')
        .del();
    await db.insert({
        cache_identifier: 'riot_items',
        last_modified: new Date(),
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
    }).into('cache_control');
};

module.exports = {
    items
};
