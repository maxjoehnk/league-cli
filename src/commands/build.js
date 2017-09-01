const chalk = require('chalk');
const Table = require('cli-table');
const { load } = require('../config');
const { riot, championgg, db } = require('league-api');

const createSkillRow = skill => row => row.hash.split('-')
    .map((s, i) => {
        if (i === 0) {
            return chalk.red(skill);
        }else if (s === skill) {
            return s;
        }
        return '';
    });

const createQ = createSkillRow('Q');
const createW = createSkillRow('W');
const createE = createSkillRow('E');
const createR = createSkillRow('R');

const createSkillTable = (header, row) => {
    const levels = [...Array(18).keys()].map(i => `${i + 1}`);

    const table = new Table({
        head: [chalk.white(header), ...levels]
    });

    table.push(
        createQ(row),
        createW(row),
        createE(row),
        createR(row)
    );

    return table;
};

const createItemRow = (row, items) => row.hash.split('-')
    .filter((_, i) => i > 0)
    .map(id => parseInt(id, 10))
    .map(id => items.find(item => item.id === id))
    .map(item => item.name);

const createItemTable = (hashes, items) => {
    const slots = [...Array(6).keys()].map(i => `${i + 1}`);
    const table = new Table({
        head: [chalk.white('Items'), ...slots]
    });
    table.push([chalk.red('Most Frequent'), ...createItemRow(hashes.highestCount, items)]);
    table.push([chalk.red('Highest Win %'), ...createItemRow(hashes.highestWinrate, items)]);
    return table;
};

const stats = async args => {
    const cache = await db.connect();
    await db.migrate(cache);
    const config = await load(args.config);
    const champions = await riot.champions(cache, config.keys.riot);
    const items = await riot.items(cache, config.keys.riot);
    const { id } = champions.find(({ name }) => name === args.champion);
    const stats = await championgg.champion(config.keys['champion.gg'], id);
    const itemTable = createItemTable(stats.hashes.finalitemshashfixed, items);
    const mostFrequent = createSkillTable('Most Frequent', stats.hashes.skillorderhash.highestCount);
    const highestWin = createSkillTable('Highest Win %', stats.hashes.skillorderhash.highestWinrate);
    console.log(chalk.white.bold(`Build for ${args.champion}`));
    console.log(itemTable.toString());
    console.log(mostFrequent.toString());
    console.log(highestWin.toString());
};

module.exports = {
    command: 'build <champion>',
    describe: 'See Builds for a specified Champion',
    builder: {
        champion: {}
    },
    handler: async args => {
        try {
            await stats(args);
        }catch (err) {
            console.error(err);
        }
        process.exit(0);
    }
};
