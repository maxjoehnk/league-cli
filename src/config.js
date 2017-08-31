const yaml = require('js-yaml');
const fs = require('fs');

const read = path => new Promise((resolve, reject) => fs.readFile(path, 'utf8', (err, content) => {
    if (err) {
        return reject(err);
    }
    resolve(content);
}));

const load = async path => {
    const content = await read(path);
    return yaml.safeLoad(content);
};

module.exports = {
    load
};