var db = require('./db')
var mongodb = require('mongodb')
var lib = require('./lib')

module.exports = {

    handle: function (env) {

        var _id = null
        if (env.parsedUrl.query._id) {
            try {
                _id = mongodb.ObjectID(env.parsedUrl.query._id)
            } catch (ex) {
                lib.serveError(env.res, 406, '_id ' + env.parsedUrl.query._id + ' is not valid')
                return
            }
        }

        switch (env.req.method) {
            case 'GET':
                break;
            case 'POST':
                if (_id) {
                    delete env.parsedPayload._id;
                    delete env.parsedPayload.credential_id;
                    env.parsedPayload.person_id = _id;
                    db.credentialsCollection.insertOne(env.parsedPayload, function (err, result) {
                        if (err || !result.ops || !result.ops[0])
                            lib.serveError(env.res, 400, 'insert failed')
                        else
                            lib.serveJson(env.res, result.ops[0])
                    })
                } else {
                    lib.serveError(env.res, 404, 'no object id')
                }
                break;
            case 'PUT':
                if (_id) {
                    if (env.sessionData.role == 2 || env.parsedUrl.query.token){
                        db.credentialsCollection.findOneAndUpdate({ person_id: _id },
                            { $set: env.parsedPayload }, { returnOriginal: false },
                            function (err, result) {
                                if (err || !result.value)
                                    lib.serveError(env.res, 404, 'object not found')
                                else
                                    lib.serveJson(env.res, result.value)
                            })
                    } else {
                        delete env.parsedPayload._id
                        delete env.parsedPayload.credential_id;
                        db.credentialsCollection.findOneAndUpdate({ _id: _id },
                            { $set: env.parsedPayload },
                            { returnOriginal: false }, function (err, result) {
                                if (err || !result.value)
                                    lib.serveError(env.res, 404, 'object not found')
                                else
                                    lib.serveJson(env.res, result.value)
                            })
                    }
                } else {
                    lib.serveError(env.res, 404, 'no object id')
                }
                break;
            default:
                lib.serveError(env.res, 405, 'method not implemented')
        }
    }
};
