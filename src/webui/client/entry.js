require(['eventemitter2', 'application',
        'modules/puppeteering/router',
        'modules/animations/animations_app',
        'modules/expressions/expressions_app',
        'modules/motors/motors_app',
        'modules/performances/performances_app',
        'modules/interaction/interaction_app',
        'modules/monitor/router',
        'modules/start/router',
        'modules/settings/router'
    ],
    function (EventEmitter2, app) {
        app.start();
    });
