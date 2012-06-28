/*global describe:false, it:false */


/*This file just lints the source code*/


var jshint = require('jshint');
var mocha  = require('mocha');
var assert = require('should');

var fs   = require('fs');
var path = require('path');


/**
 * An object containing the settings for jshint
 *
 * For detailed description of options see
 * http://www.jshint.com/options/
 *
 * @type {Object}
 */
var lintOptions = {};

//Enivronment
lintOptions.node = true;

//Enforcing options
lintOptions.bitwise = true;
lintOptions.devel = false;
lintOptions.eqeqeq = true;
lintOptions.immed = true;
lintOptions.newcap = true;
lintOptions.noarg = true;
lintOptions.nonew = true;
lintOptions.undef = true;
lintOptions.trailing = true;


//Relaxing Option
lintOptions.lastsemic = true;
lintOptions.strict = false;
lintOptions.es5 = true;

//Super strict formatting option
lintOptions.white = true;

/**
 * The entry point of the test begins recursively walking directories.
 */
describe('coding style', function () {
    describeDirectory('./');
});

/**
 * Recursively walk a directory, ignoring .git and node_modules and running a method on all .js or .json files.
 *
 * @param  {string} dir The directory at which to begin the walk
 */
function describeDirectory(dir) {
    describe(dir, function () {
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i++) {
            if (files[i] !== '.git' && files[i] !== 'node_modules' && files[i] !== 'thirdparty') {
                if (fs.statSync(dir + files[i]).isDirectory()) {
                    describeDirectory(dir + files[i] + '/');
                } else if (/(\.js(on)?)|(\.html)$/g.test(files[i])) {
                    describeFile(dir + files[i]);
                }
            }
        }
    });
}

/**
 * Test a file to ensure it meets the proper coding standards
 *
 * @param  {string} file The name of the file to test
 */
function describeFile(file) {
    describe(file, function () {
        it('lints', function (done) {
            fs.readFile(file, function (err, data) {
                assert.ifError(err);
                if (/\.js(on)?$/.test(file)) {
                    if (!jshint.JSHINT(data.toString(), lintOptions)) {
                        var errors = jshint.JSHINT.errors.filter(function (e) {
                            return e !== null;
                        }).map(function (e) {
                            return 'line:' + e.line + ' char:' + e.character + ' ' + e.reason + '\n\t' + e.evidence;
                        });
                        assert.ok(errors.length === 0, 'Fails coding standards:\n' + errors.join("\n"));
                    }
                    data.toString().split(/\n/g).forEach(function (line, i) {
                        line.length.should.be.below(150, 'line ' + (i + 1) + ' is ' + line.length +
                            ' characters long, lines longer than 150 characters should be splint onto two lines.');
                    });
                } else if (/\.html$/.test(file)) {
                    require('qejs').compile(file);
                }
                done();
            });
        });
    });
}