/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot/_http.js
 *
 * Serveur HTTP
 */

var http = require('http');
var url  = require('url');
var zlib = require('zlib');

var cache = require('./_cache');
var console = require('./_console');
var util  = require('./_util');
var sessions = require('./_sessions');


/**
 * class Target(HTTPRequest req, HTTPResponse res, URL url, FileHand|FuncHand|TmplHand hand)
 */
function Target(req, res, url, hand)
{
    this.time = process.hrtime(); // :HrTime

    // Write
    this.code   = 200; // :int
    this.header = {}; // :Map<String, String>

    this.type   = hand.type; // :String

    // Read/Write
    this.cookies = util.parseCookies(req.headers['cookie'] || ''); // :Map<String, String>
    this.session = {}; // :Map<String, Object>

    // Read
    this._session = null; // :Session

    this.req = req; // :ClientRequest
    this.res = res; // :ServerResponse

    this.post = {}; // :Map<String, String>

    this.ip  = req.socket.remoteAddress;
    this.url = url; // :URL

    // Constructor
    if(hand.sess)
    {
        this._session = sessions.get(this.cookies['bksessid'], this.ip);

        this.cookies['bksessid'] = this._session.id;

        this.session = this._session.data;
    }

    if(req.method === 'POST')
    {
        var data = '';
        var self = this;

        req.on('data', function(chunk)
        {
            data += chunk.toString();

            if(data.length > 1048576) // 1 Mo
            {
                self.code = 413;
                self.type = 'text/plain';

                self.send('Requête abandonnée: Trop de données');

                req.connection.destroy();
            }
        });
        req.on('end', function()
        {
            self.post = util.parseData(data);

            hand.open(self);
        });
    }
    else
    {
        hand.open(this);
    }
}
// function write(String|Buffer data):void
Target.prototype.write = function(data)
{
    if(!this.res.headersSent)
    {
        this.header['Set-Cookie']    = util.cookiesToHeader(this.cookies);
        this.header['Content-Type']  = this.type;
        this.header['Server']        = 'Bloknot by juloo';
        this.header['Accept-Ranges'] = 'bytes';

        this.res.writeHead(this.code, this.header);
    }

    this.res.write(data);
};
// function send(String|Buffer data = ''):void
Target.prototype.send = function(data)
{
    if(typeof data !== 'undefined')
    {
        this.write(data);
    }

    if(this._session !== null)
    {
        this._session.data = this.session;
    }

    this.res.end();

    console.log('§2[HTTP] §r'+ this.code +' §b'+ this.url.href +'§r §8'+ this.ip +' ['+ (this.req.headers['x-forwarded-for'] || 'no proxy')
        +']§r ('+ util.ua(this.req.headers['user-agent'] || 'no agent') +') §f<'+ (this.time = util.hrtime(this.time)) +'>', true);
};

/**
 * class FileHand(String path, String type, String filename, int cache, boolean gzip)
 */
function FileHand(path, type, filename, cache, gzip)
{
    this.path  = path;  // :String (pathname to match)
    this.filename = filename; // :String
    this.cache = cache; // :int    (cache-control)

    this.type  = type;  // :String (file mime-type)
    this.sess  = false; // :boolean
    this.gzip  = gzip;  // :boolean
}
// function match(String path):boolean
FileHand.prototype.match = function(path)
{
    return (this.path === path);
};
// function open(Target target):void
FileHand.prototype.open = function(target)
{
    var file = cache.get(this.filename, null);

    if(target.req.headers['if-none-match'] && target.req.headers['if-none-match'] === file.md5)
    {
        target.code = 304;
        target.send();
    }
    else
    {
        var self = this;

        file.load(function()
        {
            target.header['Content-Type'] = self.type;
            target.header['Cache-Control'] = 'max-age='+ self.cache;
            target.header['ETag'] = file.md5;

            if(self.gzip)
            {
                target.header['Content-Encoding'] = 'gzip';
                target.header['Content-Length'] = file.gziped.length;

                target.send(file.gziped);
            }
            else
            {
                target.header['Content-Length'] = Buffer.byteLength(file.content);

                target.send(file.content);
            }
        });
    }
};

/**
 * class FuncHand(String|RegExp reg, String type, function func, boolean sess)
 */
function FuncHand(reg, type, func, sess)
{
    this.reg  = reg;  // :String|RegExp
    this.func = func; // :function

    this.type = type; // :String
    this.sess = sess; // :boolean
}
// function match(String path):boolean
FuncHand.prototype.match = function(path)
{
    return (this.reg instanceof RegExp)? this.reg.test(path) : (path === this.reg);
};
// function open(Target target):void
FuncHand.prototype.open = function(target)
{
    var content = this.func(target);

    if(typeof content !== 'undefined')
    {
        target.send(content);
    }
};

/**
 * class HttpServeur(String host, int port)
 */
function HttpServeur(host, port)
{
    this.host = host; // :String
    this.port = port; // :int

    this.started = false; // :boolean

    this.hands = []; // :Array<FileHand|FuncHand|TmplHand>
    this.defHand = null; // :FileHand|FuncHand|TmplHand

    var self = this;

    this._http = http.createServer(function(req, res)
    {
        var query = url.parse(req.url, true, true);

        var hand = self.defHand;

        for(var i = 0; i < self.hands.length; ++i)
        {
            if(self.hands[i].match(query.pathname))
            {
                hand = self.hands[i];
                break;
            }
        }

        if(hand === null)
        {
            res.end();
        }
        else
        {
            new Target(req, res, query, hand);
        }
    });

    this._http.on('listening', function()
    {
        console.info('Serveur started ('+ self.host +':'+ self.port +')');
    });
    this._http.on('error', function(err)
    {
        console.fatal(err.code +' ('+ err.syscall +'). Reessaie dans 1 seconde...');

        setTimeout(function(){ self.stop(); self.start(); }, 1000);
    });
}
// function start():@Chainable
HttpServeur.prototype.start = function()
{
    this._http.listen(this.port, this.host);

    this.started = true;

    return this;
};
// function stop():@Chainable
HttpServeur.prototype.stop = function()
{
    this.started = false;

    this._http.close();

    return this;
};
// function add(Object options):@Chainable
HttpServeur.prototype.add = function(options)
{
    var hand = null;

    var valid = ((typeof options.path === 'string' || options.path instanceof RegExp || options.default) && typeof options.type === 'string');

    if(valid && typeof options.func === 'function')
    {
        hand = new FuncHand(options.path, options.type, options.func, !!options.session);
    }
    else if(valid && typeof options.file === 'string')
    {
        hand = new FileHand(options.path, options.type, options.file, options.cache || 0, !!options.gzip);
    }
    else
    {
        console.error(valid? 'Une des options "func", "tmpl" ou "file" valide est requise !' : 'L\'option "path" ou "type" est invalide.');
    }

    if(hand !== null)
    {
        if(options.default)
        {
            this.defHand = hand;
        }
        else
        {
            this.hands.push(hand);
        }
    }

    return this;
};

// Exports
exports.Serveur = HttpServeur;
