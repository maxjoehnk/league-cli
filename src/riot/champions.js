const fetch = require('node-fetch');
const d = require('debug')('league:riot:champions');

const champions = async(db, api_key) => {
    if (await isCacheValid(db)) {
        return await championsFromCache(db);
    }else {
        const champions = await championsFromApi(api_key);
        await cacheChampions(db, champions);
        return champions;
    }
};

const apiToImageUrl = version => image =>
    `http://ddragon.leagueoflegends.com/cdn/${version}/img/${image.group}/${image.full}`;


const apiSpellToModel = imageBuilder => spell => ({
    name: spell.name,
    description: spell.sanitizedDescription,
    image_url: imageBuilder(spell.image)
});

const apiChampionToModel = body => champion => {
    const imageBuilder = apiToImageUrl(body.version);
    const spellBuilder = apiSpellToModel(imageBuilder);
    return {
        id: champion.id,
        name: champion.name,
        title: champion.title,
        lore: champion.lore,
        image_url: imageBuilder(champion.image),
        skills: champion.spells.map(spellBuilder)
    };
};

const cacheChampionToModel = spells => champion => {
    return {
        id: champion.riot_id,
        name: champion.name,
        title: champion.title,
        lore: champion.lore,
        image_url: champion.image_url,
        skills: spells
            .filter(({ champion_id }) => champion_id === champion.riot_id)
            .map(skill => ({
                name: skill.name,
                description: skill.description,
                image_url: skill.image_url
            }))
    };
};

const modelToCacheChampion = model => {
    return {
        riot_id: model.id,
        name: model.name,
        title: model.title,
        lore: model.lore,
        image_url: model.image_url
    };
};

const modelToCacheSkills = (model) => {
    return model.skills.map(skill => ({
        champion_id: model.id,
        name: skill.name,
        description: skill.description,
        image_url: skill.image_url
    }));
};

const championsFromApi = async api_key => {
    d('Fetching all Champions from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/champions?tags=all&api_key=${api_key}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const champions = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${champions.length} Champions`);
    return champions.map(apiChampionToModel(body));
};

const championsFromCache = async db => {
    d('Fetching all Champions from Cache');
    const champions = await db.select().from('champions');
    const skills = await db.select().from('champion_spells');
    d(`Got ${champions.length} Champions`);
    return champions.map(cacheChampionToModel(skills));
};

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cache_identifier', 'riot_champions')
        .from('cache_control');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheChampions = async(db, champions) => {
    await db.transaction(async knex => {
        d('Dropping Champions Cache');
        await knex.table('champions').del();
        d('Caching Campions');
        const promises = champions.map(async model => {
            await knex.insert(modelToCacheChampion(model)).into('champions');
            await knex.insert(modelToCacheSkills(model)).into('champion_spells');
        });
        await Promise.all(promises);
        d('Updating Cache Control');
        await knex.table('cache_control')
            .where('cache_identifier', 'riot_champions')
            .del();
        await knex.insert({
            cache_identifier: 'riot_champions',
            last_modified: new Date(),
            expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
        }).into('cache_control');
    });
};

module.exports = {
    champions
};
