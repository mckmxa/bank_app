var db = require('./db')
var login = require('./login')
var collectionRest = require('./collectionRest')
var transfer = require('./transfer')
var personService = require('./personService')
var tokenService = require('./tokenService')
const lib = require('./lib')
const credentialService = require('./credentialService')

module.exports = {

    handle: function(env) {
        switch(env.parsedUrl.pathname) {
            case '/login':
                login.handle(env)
                break
            case '/person':
                if (env.sessionData.role == 1/* [1, 2].includes(env.sessionData.role) */) {
                    /*
                    var options = {}
                    options.availableMethods = env.sessionData.role == 1 ? [ 'GET', 'POST', 'PUT', 'DELETE'] : [ 'GET' ]
                    options.projectionGet = env.sessionData.role == 2 ? [ '_id', 'firstName', 'lastName' ] : null
                    */
                    if (env.req.method == 'DELETE') {
                        personService.handle(env);
                    } else {
                        collectionRest.handle(env,
                            db.personCollection, JSON.parse(JSON.stringify(env.parsedUrl.query)) /*, options */)
                    }
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break;  
            case '/token':
                if (env.sessionData.role == 1) {
                    tokenService.handle(env);
                } else if (env.parsedUrl.query.token) {
                    tokenService.handle(env);
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break;
            case '/personsWithCredentials':
                if (env.sessionData.role == 1) {
                    personService.handle(env);
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break;
            case '/changePassword':
                if (env.sessionData.role == 2 || env.parsedUrl.query.token) {
                    credentialService.handle(env);
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break;
            case '/personList':
                if(env.sessionData.role == 2 && env.req.method == 'GET') {
                    transfer.personList(env)
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break
            case '/credential':
                credentialService.handle(env);
                break;
            case '/group':
                collectionRest.handle(env, db.groupCollection, null)
                break
            case '/transfer':
                if (env.sessionData.role == 2) {
                    transfer.perform(env)
                } else {
                    lib.serveError(env.res, 403, 'permission denied')
                }
                break;
            default:
                return false;
        }
        return true;
    }

}