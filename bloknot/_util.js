/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot/_util.js
 *
 * Utiles
 */

var crypto = require('crypto');


/**
 * function uniqueId():String
 */
var lastId = 0;

var uniqueId = function()
{
    return ((++lastId).toString(36)) + (((Date.now() - 1387126564000) / 1000 | 0).toString(36));
};

/**
 * function ua(String ua):String
 */
// var osRegExp = new RegExp('(windows nt|ubuntu|android|windows phone|ipad|iphone os|mac os x)(?: ([0-9\._]+))?', 'i');
var uaRegExp = new RegExp('(Firefox|Chrome|Safari|Opera|MSIE|Googlebot(?:\\-[a-zA-Z]+)?|Bingbot)(?:\\s|/)([0-9\\.]+)', 'i');

var ua = function(ua)
{
    return (uaRegExp.test(ua))? RegExp.$1 +' '+ RegExp.$2 : ua;
};

/**
 * function hrtime(HrTime t):String
 */
var hrtime = function(t)
{
    t = process.hrtime(t);

    return getSize(t[0] + (t[1] / 1000000000), 's');
};

/**
 * function getSize(float num, String unit = ''):String
 */
var unites = ['n', 'µ', 'm', '', 'K', 'M', 'G']; // :Array<String>
var base = {'o': 1024, 'B': 1024}; // :Map<String, int>
var max = {'%': 3, 's': 3, 'g': 4, 'm': 4}; // :Map<String, int>
var min = {'%': 3, 'o': 3, 'B': 3}; // :Map<String, int>

var getSize = function(num, unit)
{
    var b = base[unit] || 1000; // :int
    var n = min[unit] || 0; // :int

    var ex = Math.min(Math.max(((Math.log(num) / Math.log(b) | 0) + 3), n), (max[unit] || 6)); // :int

    num /= Math.pow(b, ex - 3); // :float

    if(num < 1 && ex > n)
    {
        ex--;
        num *= b;
    }

    var round = (num > 1)? ((num > 9)? ((num > 29)? 1 : 10) : 100) : 1000; // :int

    return ((num * round | 0) / round) +' '+ unites[ex] + (unit || '');
};

/**
 * function md5(String str):String
 */
var md5 = function(str)
{
    var md5 = crypto.createHash('md5');
    md5.update(str);
    return md5.digest('hex');
};

/**
 * function parseUrl(String data):Map<String, String>
 */
var dataRegExp = new RegExp('(\\w+)\\s*=\\s*([^&]+)', 'g');

var parseData = function(data)
{
    var obj = {};

    data.replace(dataRegExp, function(match, c1, c2)
    {
        obj[c1] = unescape(c2);
    });

    return obj;
};

/**
 * function parseCookies(String cook):Map<String, String>
 */
var cookieRegExp = new RegExp('(\\w+)\\s*=\\s*([^;]+)', 'g');

var parseCookies = function(cook)
{
    var cookies = {};

    cook.replace(cookieRegExp, function(match, c1, c2)
    {
        cookies[c1] = c2;

        return '';
    });

    return cookies;
};

/**
 * function cookiesToHeader(cookies):Array<String>
 */
var cookiesToHeader = function(cookies)
{
    var header = [];

    for(var key in cookies)
    {
        header.push(key +'='+ cookies[key]);
    }

    return header;
};

/**
 * function juloot(String content, Map<String, String> data):String
 */
var tAllRegExp = new RegExp('<\\?(\\w+)\\?>|<%([^%]+)%>', 'g'); // :RegExp

var juloot = function(content, data)
{
    return content.replace(tAllRegExp, function(match, c1, c2)
    {
        if(c1)
        {
            return data[c1] || global[c1] || console.warn('Clef "'+ c1 +'" introuvable.') || '';
        }
        else if(c2)
        {
            try{
                return eval(c2) || '';
            }
            catch(e)
            {
                console.error(e);
                return '';
            }
        }

        console.error('Faux match ('+ match +')');
    });
};

// Exports
exports.ua       = ua;
exports.hrtime   = hrtime;
exports.uniqueId = uniqueId;
exports.getSize  = getSize;
exports.md5      = md5;
exports.parseData       = parseData;
exports.parseCookies    = parseCookies;
exports.cookiesToHeader = cookiesToHeader;
exports.juloot   = juloot;
