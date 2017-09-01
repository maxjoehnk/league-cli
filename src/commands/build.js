const chalk = require('chalk');
const Table = require('cli-table');
const { join } = require('path');
const { load } = require('../config');
const riot = require('../riot.js');
const championgg = require('../championgg.js');
const { connect, migrate } = require('../db');

const createRow = skill => row => {
    return row.hash.split('-')
        .map((s, i) => {
            if (i === 0) {
                return chalk.red(skill);
            }else if (s === skill) {
                return s;
            }
            return '';
        });
};

const createQ = createRow('Q');
const createW = createRow('W');
const createE = createRow('E');
const createR = createRow('R');

const createTable = (header, row) => {
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

const stats = async (args) => {
    const db = await connect();
    await migrate(db);
    const config = await load(args.config);
    const champions = await riot.champions(db, config.keys.riot);
    const { id } = champions.find(({ name }) => name === args.champion);
    const stats = await championgg.champion(config.keys['champion.gg'], id);
    const mostFrequent = createTable('Most Frequent', stats.hashes.skillorderhash.highestCount);
    const highestWin = createTable('Highest Win %', stats.hashes.skillorderhash.highestWinrate);
    console.log(chalk.white.bold(`Build for ${args.champion}`));
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
