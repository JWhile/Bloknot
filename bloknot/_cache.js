/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot/_cache.js
 *
 * Cache de fichier
 */

var fs   = require('fs');
var zlib = require('zlib');

var console = require('./_console');
var util = require('./_util');


var cachedFiles = []; // :Array<File>

/**
 * class File(String filename, String encoding)
 */
function File(filename, encoding)
{
    this.name     = filename; // :String
    this.encoding = encoding; // :String|null

    this.lastUse  = 0; // :int

    this.content  = null; // :Buffer|String
    this.md5      = null; // :String
    this.gziped   = null; // :Buffer

    this.isLoad   = false; // :boolean
    this.isGzip   = false; // :boolean
}
// function getContent():Buffer|String
File.prototype.getContent = function()
{
    if(!this.isLoad)
    {
        var t = process.hrtime();

        this.content = fs.readFileSync(this.name, {encoding: this.encoding});
        this.isLoad  = true;

        console.info('Load file: §b'+ this.name +'§r §8('+ util.getSize(this.content.length, 'o') +')§r §f<'+ util.hrtime(t) +'>', true);
    }

    return this.content;
};
// function load(function callback):void
File.prototype.load = function(callback)
{
    if(this.isLoad && this.isGzip)
    {
        process.nextTick(callback);
        return;
    }

    var t = process.hrtime();

    var steps = 3;
    var suite = function()
    {
        if(--steps === 0)
        {
            process.nextTick(callback);

            console.info('Load file: §b'+ self.name +'§r §8('+ util.getSize(self.content.length, 'o') +')§r §f<'+ util.hrtime(t) +'>', true);
        }
    };

    var self = this;

    var readCallback = function(err, data)
    {
        if(err)
        {
            console.fatal('(readFile) '+ err);
        }

        self.content = data;
        self.isLoad = true;
        suite();

        zlib.gzip(data, function(err, gziped)
        {
            if(err)
            {
                console.fatal('(gzip) '+ err);
            }

            self.gziped = gziped;
            self.isGzip = true;
            suite();
        });

        self.md5 = util.md5(data);

        suite();
    };

    if(this.isLoad)
    {
        readCallback(false, this.content);
    }
    else
    {
        fs.readFile(this.name, {encoding: this.encoding}, readCallback);
    }

    return this;
};

/**
 * function getFile(String filename, String encoding):File
 */
var getFile = function(filename, encoding)
{
    var file = null;

    for(var i = 0, f; i < cachedFiles.length; ++i)
    {
        f = cachedFiles[i];

        if(f.name === filename && f.encoding === encoding)
        {
            file = f;
            break;
        }
    }

    if(file === null)
    {
        file = new File(filename, encoding);
        cachedFiles.push(file);

        fs.watch(filename, function(evt, newName)
        {
            for(var i = 0; i < cachedFiles.length; ++i)
            {
                if(cachedFiles[i].name === filename)
                {
                    cachedFiles.splice(i, 1);
                    --i;

                    console.info('Fichier libéré: §b'+ filename +'§r ('+ evt +')', true);
                }
            }
        });

        console.info('Cache file: §b'+ filename +'§r (encoding='+ encoding +')', true);
    }

    file.lastUse = Date.now() / 1000 | 0;

    return file;
};

// Exports
exports.get = getFile;
