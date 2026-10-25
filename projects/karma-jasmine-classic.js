// Karma framework loading zone.js, jasmine-core and the karma-jasmine boot/adapter files as classic scripts.
// The @angular/build karma builder converts every included `js` file to `type: 'module'`,
// which makes jasmine-core report "jasmine-core isn't an ES module but it was loaded as one".
// Classic scripts run before all modules, so zone.js has to be loaded the same way before jasmine:
// jasmine.clock() refuses to install over timer functions patched after jasmine was loaded.
// The later zone.js import from polyfills reuses the already loaded Zone.
// List it right after 'jasmine' in `frameworks`, so it sees the files karma-jasmine has just added.
const path = require('path');

const jasmineCore = path.normalize(path.join(path.dirname(require.resolve('jasmine-core')), 'jasmine-core', 'jasmine.js'));
const karmaJasmineFiles = [
    jasmineCore,
    path.normalize(path.join(path.dirname(require.resolve('karma-jasmine')), 'boot.js')),
    path.normalize(path.join(path.dirname(require.resolve('karma-jasmine')), 'adapter.js')),
];
// resolves to the classic umd bundle
const zoneJs = require.resolve('zone.js');

const keepClassic = (file) => {
    // ignore writes, so the angular builder can't switch the file to a module later
    Object.defineProperty(file, 'type', { get: () => 'js', set: () => {}, enumerable: true });
};

const keepJasmineClassic = function (files) {
    for (const file of files) {
        if (typeof file !== 'string' && karmaJasmineFiles.includes(path.normalize(file.pattern))) {
            keepClassic(file);
        }
    }

    const jasmineIndex = files.findIndex(file => typeof file !== 'string' && path.normalize(file.pattern) === jasmineCore);
    if (jasmineIndex === -1) {
        throw new Error('jasmine-classic: list it after the "jasmine" framework.');
    }

    const zoneFile = { pattern: zoneJs, included: true, served: true, watched: false };
    keepClassic(zoneFile);
    files.splice(jasmineIndex, 0, zoneFile);
};

keepJasmineClassic.$inject = ['config.files'];

module.exports = {
    'framework:jasmine-classic': ['factory', keepJasmineClassic]
};
