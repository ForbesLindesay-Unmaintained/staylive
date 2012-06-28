module.exports = function (options) {
    options = options || {};

    var prefix = options.prefix || '/staylive';
    var folders = options.folders || [];


    var id = Math.round((new Date()).getTime() / 100);

    var sendAll = function () { };

    function send(res) {
        var v = {};
        var sent = false;
        v.next = sendAll;
        return function (id) {
            if (!sent) {
                sent = true;
                res.json(id);
                v.next(id);
                delete v.next;
            }
        };
    }


    function trigger(curr, prev) {
        if (curr !== prev) {
            id = Math.round((new Date()).getTime() / 100);
            sendAll(id);
        }
    }

    function checkDirectory(dir) {
        var fs = require('fs');
        dir = dir.replace(/(\/|\\)?$/g, '/');
        if (fs.statSync(dir).isDirectory()) {
            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                checkDirectory(dir + files[i] + '/');
            }
        } else {
            fs.watchFile(dir, {persistent: false}, trigger);
        }
    }
    for (var i = 0; i < folders.length; i++) {
        checkDirectory(folders[i]);
    }
    for (var j = 1; j < arguments.length; j++) {
        checkDirectory(arguments[j]);
    }

    setInterval(function () {
        sendAll(id);
    }, 20000);

    function shouldWatch(file) {
        return !/output/g.test(file) && (!/\.js$/g.test(file) || /client/g.test(file));
    }

    return function (req, res, next) {
        prefix = prefix.replace(/(\/|\\)?$/g, '');
        var url = require('url').parse(req.url).pathname;
        if (url !== prefix + '/client.js' && url !== prefix + '/api') return next();

        if (url === prefix + '/api') {
            if (req.query.id == id.toString()) {
                sendAll = send(res);
                return;
            } else {
                return res.json(id);
            }
        }

        var client = [
            '(function(){',
            'if(typeof jQuery === "undefined") throw new Error("You must install jQuery to use staylive");',
            'var old = null;',
            'function test(){setTimeout(function(){',
            'jQuery.ajax("' + prefix  + '/api?id="+old, {success: function(data){',
            'if(old === null) old = data;',
            'else if (old !== data) location.reload();',
            '}, }).always(test);},10);',
            '}',
            'test();',
            '}())'
        ];

        if (url === prefix + '/client.js') {
            return res.send(client.join('\n'));
        }
        next();
    };
};