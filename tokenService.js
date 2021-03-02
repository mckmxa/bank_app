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
                db.tokenCollection.findOne({ token: env.parsedUrl.query.token }, function (err, result) {
                    if (err || !result)
                        lib.serveError(env.res, 404, 'object not found')
                    else
                        lib.serveJson(env.res, result)
                })
                break;
            case 'POST':
                if (_id) {
                    delete env.parsedPayload._id;
                    env.parsedPayload.person_id = _id;

                    db.tokenCollection.findOneAndUpdate(
                        { person_id: _id },
                        { $set: env.parsedPayload },
                        { returnOriginal: false }, function (err, result) {
                            if (err) {
                                lib.serveError(env.res, 404, 'object not found')
                            } else if (!result.value) {
                                db.tokenCollection.insertOne(env.parsedPayload, function (err, result) {
                                    if (err || !result.ops || !result.ops[0])
                                        lib.serveError(env.res, 400, 'insert failed')
                                    else
                                        lib.serveJson(env.res, result.ops[0])
                                })
                            } else {
                                lib.serveJson(env.res, result.value)
                            }
                        })
                } else {
                    lib.serveError(env.res, 404, 'no object id')
                }
                break;
            case 'DELETE':
                if (_id) {
                    db.tokenCollection.deleteOne({ _id: _id }, function (err, res) {
                        if (err || !res)
                            lib.serveError(env.res, 404, 'delete failed')
                        else
                            lib.serveJson(env.res, res)
                    })
                } else {
                    lib.serveError(env.res, 404, 'no object id')
                }
                break;
            default:
                lib.serveError(env.res, 405, 'method not implemented')
        }
    }
};
