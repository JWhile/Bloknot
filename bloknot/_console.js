/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot/_console.js
 *
 * Console
 */

var n_util = require('util');
var util = require('./_util');


/**
 * class Commande(String name, function hand, String info, boolean isProgram)
 */
var commandes = []; // :Array<Commande>
var program = null; // :Commande

function Commande(name, hand, args, info, isProgram)
{
    this.name = name; // :String
    this.hand = hand; // :function
    this.args = args; // :String
    this.info = info; // :String
    this.isProgram = isProgram; // :boolean
}
// function test(String name, Array<String> args)
Commande.prototype.test = function(name, args)
{
    if(name === this.name)
    {
        if(this.isProgram)
        {
            program = this;
            console.log(this.name +'>');
        }
        else
        {
            this.hand(args);
        }

        return true;
    }

    return false;
};

/**
 * function add(String name, function hand, String info = '', boolean isProgram = false):@Chainable
 */
var add = function(name, hand, args, info, isProgram)
{
    commandes.push(new Commande(name, hand, args, info || '', !!isProgram));

    return exports;
};

/**
 * function log(String message, boolean format = false):void
 */
var allowColor = true; // :boolean

// Formats :
var colors = {
    '0': '\x1B[30m', // Black
    '1': '\x1B[34m', // Blue      (Dark)
    '2': '\x1B[32m', // Green     (Dark)
    '3': '\x1B[36m', // Turquoise (Dark)
    '4': '\x1B[31m', // Red       (Dark)
    '5': '\x1B[35m', // Purple    (Dark)
    '6': '\x1B[33m', // Gold
    '7': '\x1B[37m', // Gray
    '8': '\x1B[90m', // Gray      (Dark)
    '9': '\x1B[94m', // Blue
    'a': '\x1B[92m', 'A': '\x1B[92m', // Green
    'b': '\x1B[96m', 'B': '\x1B[96m', // Turquoise
    'c': '\x1B[91m', 'C': '\x1B[91m', // Red
    'd': '\x1B[95m', 'D': '\x1B[95m', // Purple
    'e': '\x1B[93m', 'E': '\x1B[93m', // Yellow
    'f': '\x1B[97m', 'F': '\x1B[97m', // White
    'r': '\x1B[39m', 'R': '\x1B[39m'  // Reset
};
var formatRegExp = new RegExp('§([0-9a-fr])', 'gi'); // :RegExp

var log = function(message, color)
{
    process.stdout.write((color? message.replace(formatRegExp, function(match, c1){ return allowColor? (colors[c1] || match) : ''; }) : message) + (allowColor? colors['r'] : '') +'\n');
};

/**
 * function inspect(Object obj):void
 */
var inspect = function(obj)
{
    process.stdout.write(n_util.inspect(obj, {'showHidden': true, 'depth': 5, 'colors': true}) +'\n');
};

/**
 * function info(String message, boolean color = false):void
 */
var info = function(message, color)
{
    log((allowColor? colors['3'] +'[INFO] '+ colors['r'] + message : '[INFO] '+ message), color);
};

/**
 * function debug(String message, boolean color = false):void
 */
var debug = function(message, color)
{
    log((allowColor? colors['b'] +'[DEBUG] '+ colors['r'] + message : '[DEBUG] '+ message), color);
};

/**
 * function warn(String message, boolean color = false):void
 */
var warn = function(message, color)
{
    log((allowColor? colors['6'] +'[WARN] '+ colors['r'] + message : '[WARN] '+ message), color);
};

/**
 * function error(String message, boolean color = false):void
 */
var error = function(message, color)
{
    log((allowColor? colors['c'] +'[ERROR] '+ colors['r'] + message : '[ERROR] '+ message), color);
};

/**
 * function fatal(String message, boolean color = false):void
 */
var fatal = function(message, color)
{
    log((allowColor? colors['4'] +'[FATAL] '+ colors['r'] + message : '[FATAL] '+ message), color);
};

/**
 * function execute(String cmd):void
 */
var execute = function(cmd)
{
    cmd = cmd.trim();

    var args = cmd.split(' '); // :Array<String>
    var name = args.splice(0, 1)[0]; // :String

    if(program !== null)
    {
        if(program.name === name)
        {
            program = null;
            log('\n>');
        }
        else
        {
            program.hand(cmd);
        }
    }
    else
    {
        for(var i = 0; i < commandes.length; ++i)
        {
            if(exec = commandes[i].test(name, args))
            {
                return;
            }
        }

        error('Commande "'+ name +'" inconnue ('+ cmd +'). Tapez "help"');
    }
};

/**
 * Initialisation
 */
// stdin
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', execute);

// default cmd
add('eval', function(cmd)
{
    try{
        inspect(eval(cmd));
    }
    catch(e)
    {
        error(e);
    }

}, '', 'Eval Mode', true);

add('colors', function(args)
{
    var c = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'f'];
    var a = (args.length > 0)? ' '+ args.join(' ') : ' Couleurs de la console';

    log(' >> Couleurs de la console:');

    for(var i = 0; i < c.length; ++i)
    {
        log('    §'+ c[i] +'#'+ c[i] + a, true);
    }

}, '(test)', 'Liste des couleurs', false);

add('help', function(args)
{
    log(' >> Commandes:');

    for(var i = 0, c; i < commandes.length; ++i)
    {
        c = commandes[i];

        log('    - '+ (c.isProgram? '[Program] ' : '[Command] ') + c.name + ((!!c.args)? ' '+ c.args : '') +' :: '+ c.info);
    }

}, '', 'Affiche ce message', false);

add('mem', function(args)
{
    var mem = process.memoryUsage();

    var ratio = mem.rss / 77;
    var ratioUsed = mem.heapUsed / ratio + 0.5 | 0;
    var ratioTotal = mem.heapTotal / ratio + 0.5 | 0;

    var bar = '';

    for(var i = 0, c; i < 77; ++i)
    {
        if(i < ratioUsed && i < ratioTotal)
        {
            if(c !== '2')
            {
                bar += '§2';
            }

            bar += '|';
        }
        else if(i < ratioUsed)
        {
            if(c !== '4')
            {
                bar += '§4';
            }

            bar += '|';
        }
        else if(i < ratioTotal)
        {
            if(c !== '8')
            {
                bar += '§8';
            }

            bar += '=';
        }
        else
        {
            if(c !== 'r')
            {
                bar += '§r';
            }

            bar += ' ';
        }
    }

    log('['+ bar +']', true);
    log('Alouée: §8'+ util.getSize(mem.heapTotal, 'B') +'§r / '+ util.getSize(mem.rss, 'B') +' ('+ util.getSize(mem.heapTotal / mem.rss * 100, '%') +')', true);
    log('Utilisée: §2'+ util.getSize(mem.heapUsed, 'B') +'§r / §8'+ util.getSize(mem.heapTotal, 'B') +'§r ('+ util.getSize(mem.heapUsed / mem.heapTotal * 100, '%') +')', true);

}, '', 'Affiche la mémoire utilisée/libre', false);

// Exports
exports.add     = add;
exports.inspect = inspect;
exports.execute = execute;

exports.log     = log;

exports.info    = info;
exports.debug   = debug;
exports.warn    = warn;
exports.error   = error;
exports.fatal   = fatal;

exports.setColor = function(allow)
{
    allowColor = allow;
};
