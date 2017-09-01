const chalk = require('chalk');
const { load } = require('../config');
const { riot, db } = require('league-api');
const { render } = require('../image');
const width = require('wcwidth');
const d = require('debug')('league:commands:champion');

// @TODO: refactor and extract into ui tools
const print = (left, right) => {
    const columns = process.stdout.columns;
    const rows = [];
    const imageWidth = width(left[0]);
    d(`We got ${columns} Columns`);
    d(`image is ${imageWidth} columns wide`);
    const padding = ' ';
    const paddingWidth = width(padding);
    const rightAvailable = columns - imageWidth - paddingWidth;
    d(`available rows: ${rightAvailable}`);
    left.forEach((l, i) => {
        let r = right[i];
        if (r === null || r === undefined) {
            return rows.push(l);
        }
        const w = width(r);
        if (w <= rightAvailable) {
            return rows.push(l + padding + r);
        }else {
            const tr = r.substring(0, rightAvailable);
            const nr = r.substring(rightAvailable);
            right.splice(i + 1, 0, nr);
            rows.push(l + padding + tr);
        }
    });
    rows.forEach(row => process.stdout.write(row + '\n'));
};

const info = async (args) => {
    const cache = await db.connect();
    await db.migrate(cache);
    const config = await load(args.config);
    const champions = await riot.champions(cache, config.keys.riot);
    const champion = champions.find(champ => champ.name === args.champion);
    if (champion) {
        d('Champion found', { name: champion.name, title: champion.title, id: champion.id });
        const image = await render(champion.imageUrl);
        const mapSpell = spell => spells => {
            const assoc = {
                Q: 0,
                W: 1,
                E: 2,
                R: 3
            };
            const skill = spells[assoc[spell]];
            return [
                chalk.bold.red(spell) + ' ' + chalk.red(skill.name),
                skill.description
            ];
        };
        const mapQ = mapSpell('Q');
        const mapW = mapSpell('W');
        const mapE = mapSpell('E');
        const mapR = mapSpell('R');
        const desc = [
            null,
            chalk.bold.white(champion.name),
            chalk.white(champion.title),
            null,
            chalk.bold.white('Spells'),
            null,
            ...mapQ(champion.skills),
            null,
            ...mapW(champion.skills),
            null,
            ...mapE(champion.skills),
            null,
            ...mapR(champion.skills)
        ];
        print(image, desc);
    }else {
        console.warn('Unknown Champion', args.champion);
    }
};

module.exports = {
    command: 'champion <champion>',
    describe: 'See Info for a specific champion',
    builder: {
        champion: {}
    },
    handler: async args => {
        try {
            await info(args);
        }catch (err) {
            console.error(err);
        }
        process.exit(0);
    }
};
