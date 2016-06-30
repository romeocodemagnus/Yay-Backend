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
            },
            azure: {
                hubname : "friendzi_dev_push",
                connection_string: "Endpoint=sb://friendzidev.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6IxCONnYfif9vTGyI/LzuYimw8QZG1TMEMThUp5foi8="
            }
        },
        production: {
            env: 'production',
            port		: 3000,
            db: {
                host	: 'localhost',
                port	: 3306,
                name	: 'frendzi',
                user 	: 'root',
                pass 	: 'pwd@frendzi_db'
            },
            azure: {
                hubname : process.env.PUSH_HUBNAME,
                connection_string: process.env.PUSH_CONNECTION_STRING
            }
        },
        staging: {
            env: 'production',
            port		: 3000,
            db: {
                host	: 'localhost',
                port	: 3306,
                name	: 'frendzi',
                user 	: 'root',
                pass 	: 'pwd@frendzi_db'
            },
            azure: {
                hubname : process.env.PUSH_DEV_HUBNAME,
                connection_string: process.env.PUSH_DEV_CONNECTION_STRING
            }
        }
    };

// set development as default environment
!process.env['NODE_ENV'] && (process.env['NODE_ENV'] = 'development');
config = config[process.env['NODE_ENV']];
console.log("ENV", process.env['NODE_ENV']);
module.exports = config;