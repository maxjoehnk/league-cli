const yaml = require('js-yaml');
const fs = require('fs');
const { join } = require('path');

const riot = process.env.RIOT_API_KEY;
const gg = process.env.CHAMPION_GG_API_KEY;

const file = yaml.safeDump({
    keys: {
        riot,
        'champion.gg': gg
    }
});

fs.writeFile(join(__dirname, '../config.yml'), file, (err) => {
    if (err) {
        console.error(err);
    }
});
