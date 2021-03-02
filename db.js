var mongodb = require('mongodb')

var config = require('./config')

var db = module.exports = {
    
    personCollection: null,
    historyCollection: null,
    groupCollection: null,
    credentialsCollection: null,
    tokenCollection: null,

    init: function(nextTick) {
        mongodb.MongoClient.connect(config.dbUrl, { useUnifiedTopology: true }, function(err, connection) {
            if(err) {
                console.error('Connection to database failed')
                process.exit(0)
            }
            var conn = connection.db(config.dbName)
            db.personCollection = conn.collection('persons')
            db.historyCollection = conn.collection('history')
            db.groupCollection = conn.collection('groups')
            db.credentialsCollection = conn.collection('credentials')
            db.tokenCollection = conn.collection('tokens')
            nextTick()
        })
    }

}