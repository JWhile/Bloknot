/**
 * https://github.com/JWhile/Bloknot
 *
 * bloknot/_sessions.js
 *
 * Sessions (Serveur HTTP)
 */

var util = require('./_util');


var sessions = []; // :Array<Session>

/**
 * class Session
 *
 * new Session(id, ip)
 */
function Session(id, ip)
{
    this.id = id; // :String
    this.ip = ip; // :String
    this.data = {}; // :Map<String, Object>
    this.lastUse = 0;  // :int
}
// function get(String key):Object
Session.prototype.get = function(key)
{
    return (typeof this.data[key] !== 'undefined')? this.data[key] : null;
};
// function set(String key, Object value):void
Session.prototype.set = function(key, value)
{
    this.data[key] = value;
};

/**
 * function getSession(String id, String ip):Session
 */
var getSession = function(id, ip)
{
    var sess = null;

    for(var i = 0, s; i < sessions.length; ++i)
    {
        s = sessions[i];

        if(s.id === id && s.ip === ip)
        {
            sess = s;
            break;
        }
    }

    if(sess === null)
    {
        id = util.uniqueId();

        sess = new Session(id, ip);

        console.info('Nouvelle Session: '+ id +' ('+ ip +')');

        sessions.push(sess);
    }

    sess.lastUse = Date.now() / 1000 | 0;

    return sess;
};

/**
 * function clear():void
 */
var clear = function()
{
    var now = Date.now() / 1000 | 0;

    for(var i = 0, s; i < sessions.length; ++i)
    {
        s = sessions[i];

        if(s.lastUse < (now - 3600)) // 1 heure
        {
            console.info('Session supprimee: '+ s.id +' ('+ s.ip +')');

            sessions.splice(i, 1);
            --i;
        }
    }

    setTimeout(clear, 5 * 60 * 1000); // 5 minutes
};

clear();


// Exports
exports.get = getSession;