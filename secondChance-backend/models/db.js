// db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB;

let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();

    dbInstance = client.db(dbName);  // ✅ Corrected line

    return dbInstance;
}

module.exports = connectToDatabase;
