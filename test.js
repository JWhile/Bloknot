
var bloknot = require('./bloknot');

bloknot.http('127.0.0.1', 80)
    .add({
        'path': '/',
        'type': 'text/plain',
        'func': function(target)
        {
            var visites = (target.session.get('visites') || 0) + 1;

            target.session.set('visites', visites);

            return 'Visites pour cette session: '+ visites;
        },
        'session': true
    })
    .add({
        'path': '/',
        'type': 'text/plain',
        'func': function(target)
        {
            target.code = 404;

            return 'erreur 404';
        },
        'default': 'true'
    })
    .start();