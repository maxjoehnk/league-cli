const { expect, use } = require('chai');
const asPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

use(asPromised);
use(sinonChai);

const requirePath = '../../src/commands/build';
const build = require(requirePath);

describe('commands/build', function() {
    it('should be an object', function() {
        expect(build).to.be.an.instanceof(Object);
    });

    it('should contain yargs metadata', function() {
        expect(build.command).to.eql('build <champion>');
        expect(build.describe).to.eql('See Builds for a specified Champion');
        expect(build.builder).to.eql({
            champion: {}
        });
        expect(build.handler).to.be.an.instanceof(Function);
    });
});
