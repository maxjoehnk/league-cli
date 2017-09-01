const fetch = require('node-fetch');
const { PNG } = require('pngjs');
const ansir = require('ansir');
const d = require('debug')('league:image');

const renderStream = stream => new Promise((resolve, reject) => {
    const png = new PNG({ filterType: 4 });
    png.on('parsed', () => {
        d('Parsed Image');
        const rescaled = ansir.png.createRescaledImage(png, {
            scale: 0.25
        });
        d('Rescaled Image');
        const result = [];
        ansir.renderer.block.render(rescaled, {
            ansiCodes: ansir.ansi.ANSI_COLORS_EXTENDED,
            alphaCutoff: 0.95,
            write: val => result.push(val)
        });
        d('Rendered Image');
        resolve(result);
    });
    png.on('error', err => reject(err));
    stream.pipe(png);
});

const render = async url => {
    d(`Rendering Image ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        d(res);
        throw new Error('Invalid Response');
    }
    d('Fetched Image');
    return await renderStream(res.body);
};

module.exports = {
    render
};
