/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot.js
 */

var cache = require('./bloknot/_cache');
var http  = require('./bloknot/_http');
var util  = require('./bloknot/_util');
var console = require('./bloknot/_console');


// Exports
exports.http = function(host, port)
{
    return new http.Serveur(host, port);
};
exports.getFile = cache.get;
exports.util = util;
exports.console = console;
