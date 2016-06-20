/**
 * Created by root on 6/17/16.
 */
var config = {
        development: {
            env: 'development',
            port		: 3000,
            db: {
                host	: 'localhost',
                port	: 3306,
                name	: 'frendzi',
                user 	: 'root',
                pass 	: 'root'
            }
        },
        production: {}
    };

// set development as default environment
!process.env['NODE_ENV'] && (process.env['NODE_ENV'] = 'development');
config = config[process.env['NODE_ENV']];

module.exports = config;