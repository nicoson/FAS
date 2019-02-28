//connection to database
const mongo = require('mongodb').MongoClient;
const CONNECTION = "mongodb://180.97.147.185:27017";
const DATABASE = 'iap';

function fusionDBConn(){};

/* 
    table:   需要创建的表名
    key:     索引字段 unique
*/
fusionDBConn.createTable = function(table, key) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) throw err;
            console.log(`|** fusionDBConn.createTable <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.createCollection(table, function (err, res) {
                if (err) reject(err);
                // console.log(res);
                console.log(`table ${table} created!`);
                let fieldOrSpec = {};
                fieldOrSpec[key] = 1;
                dbase.collection(table).createIndex(fieldOrSpec, {unique: true}, function(err,res) {
                    if (err) reject(err);
                    db.close();
                    resolve('done');
                });
            });
        });
    });
}

// insert data if not exist
fusionDBConn.insertData = function(table, data) {
    // console.log('|** fusionDBConn.insertData **| total insert data num: ', data.length);
    return new Promise(function(resolve, reject){
        if(data.length == 0) reject('no data');

        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log(`|** fusionDBConn.insertData <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).insertMany(data, {ordered: false}, function(err, res) {
                if (err) {
                    if(err.result.result.ok != 1) {
                        reject(err);
                    } else {
                        resolve(err.result.result.nInserted);
                    }
                } else {
                    resolve(res.insertedCount);
                }
                
                db.close();
                return
            });
        });
    });
}

fusionDBConn.queryData = function(table, conditions = {}, size=100, skip=0) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log(`|** fusionDBConn.queryData <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).find(conditions).sort({_id:1}).skip(skip).limit(size).toArray(function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
                
                db.close();
                return
            });
        });
    });
}

// update/delete with different conditions
/* Example:
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {domain: datum.domain},
                update: {$set: {
                    uid: datum.uid,
                    update_date: datum.update_date
                }}
            }
        };});
*/
fusionDBConn.updateData = function(table, operations) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) {
                reject(err);
                return;
            }
            console.log(`|** fusionDBConn.updateData <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).bulkWrite(operations, {ordered: false}, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
                
                db.close();
                return
            });
        });
    });
}

fusionDBConn.count = function(table, conditions={}) {
    return new Promise(function(resolve, reject) {
        mongo.connect(CONNECTION, function(err, db) {
            if(err) {
                reject(err);
                return;
            }
            console.log(`|** fusionDBConn.count <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).count(conditions, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
                
                db.close();
                return
            });
        });
    });
}

fusionDBConn.distinct = function(table, field={}) {
    return new Promise(function(resolve, reject) {
        mongo.connect(CONNECTION, function(err, db) {
            if(err) {
                reject(err);
                return;
            }
            console.log(`|** fusionDBConn.distinct <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).distinct(field, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.length);
                }
                
                db.close();
                return
            });
        });
    });
}

module.exports = fusionDBConn;