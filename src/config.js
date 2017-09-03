const yaml = require('js-yaml');
const fs = require('fs');
const d = require('debug')('league-cli:config');

const read = path => new Promise((resolve, reject) => fs.readFile(path, 'utf8', (err, content) => {
    d(`Reading File ${path}`);
    if (err) {
        return reject(err);
    }
    resolve(content);
}));

const load = async path => {
    const content = await read(path);
    d(`Parsing File ${path}`);
    return yaml.safeLoad(content);
};

module.exports = {
    load
};
