const mongoClient = require('mongodb').MongoClient

const state = {
    db: null
}

module.exports.connect = function (done) {
    // const url = 'mongodb://localhost:27017'
    const url = 'mongodb+srv://rithumoltr:rithu1998@cluster0.nra7zvw.mongodb.net/?retryWrites=true&w=majority'
    const dbname = 'ecart'

    mongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })


}

module.exports.get = function () {
    return state.db
}