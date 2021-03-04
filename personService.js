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
                var queryMatch = {};
                if (_id) {
                    queryMatch = { _id: _id };
                }
                   
                db.personCollection.aggregate([
                    {
                        $lookup: {
                            from: 'credentials',
                            localField: '_id',
                            foreignField: 'person_id',
                            as: 'personsWithCredentials'
                        }
                    },
                    { $match: queryMatch },
                    { $match: { active: true }},
                    { $unwind: '$personsWithCredentials' },
                    {
                        $project: {
                            _id: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            amount: 1,
                            year: 1,
                            //credential_id: '$personsWithCredentials._id',
                            role: '$personsWithCredentials.role',
                            //password: '$personsWithCredentials.password',
                            generate: '$personsWithCredentials.generate'
                        }
                    }
                ]).toArray(function (err, result) {
                    if (err)
                        lib.serveError(env.res, 404, 'no persons')
                    else
                        lib.serveJson(env.res, result)
                });
                break;
            case 'DELETE':
                if (_id) {
                    db.historyCollection.findOne({ $or: [{ sender: _id }], $or: [{ recipient: _id }]},
                        function (err, result) {
                            if (err) {
                                lib.serveError(env.res, 404, 'object not found')
                            } else if (!err && result) {
                                console.log('result', result);
                                db.personCollection.findOneAndUpdate({ _id: _id },
                                    { $set: { active: false } },
                                    { returnOriginal: false }, function (err, result) {
                                        if (err || !result.value)
                                            lib.serveError(env.res, 404, 'object not found')
                                        else 
                                            lib.serveJson(env.res, result)
                                    })
                            } else {
                                db.personCollection.findOneAndDelete({ _id: _id }, function(err, result) {
                                    if(err || !result.value)
                                        lib.serveError(env.res, 404, 'object not found')
                                    else {
                                        db.credentialsCollection.findOneAndDelete({ person_id: _id }, function(err, result) {
                                            if(err || !result.value)
                                                lib.serveError(env.res, 404, 'object not found')
                                            else 
                                                lib.serveJson(env.res, result)
                                        }) 
                                    }
                                })                                
                            }
                    })
                } else {
                    lib.serveError(env.res, 400, 'no object id')
                }
                break;
            default:
                lib.serveError(env.res, 405, 'method not implemented')
        }
    }
};
