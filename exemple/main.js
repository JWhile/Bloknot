
var bloknot = require('./../bloknot.js');

bloknot.http('127.0.0.1', 80)
    .add({ // Racine '/'
        'path': '/',
        'type': 'text/html',
        'func': function(target)
        {
            return bloknot.t('tmpl/index.juloot', {
                'githubLink': 'https://github.com/JWhile',
                'githubRepo': 'https://github.com/JWhile/Bloknot',
                'title': 'Exemple - Bloknot'
            });
        }
    })
    .add({ // favicon.ico
        'path': '/favicon.ico',
        'type': 'image/x-icon',
        'file': 'assets/icon.ico'
    })
    .add({ // logo.jpeg
        'path': '/logo.jpeg',
        'type': 'image/jpeg',
        'file': 'assets/logo.jpeg',
        'cache': 604800,
        'gzip': true
    })
    .add({ // styles.css
        'path': '/styles.css',
        'type': 'text/css',
        'file': 'assets/styles.css',
        'cache': 86400,
        'gzip': true
    })
    .add({ // Route par défaut
        'default': true,
        'type': 'text/plain',
        'func': function(target)
        {
            target.code = 404;

            return 'erreur 404';
        }
    })
    .start();
