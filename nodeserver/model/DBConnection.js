//connection to database
const config = require('./config');
const mongo = require('mongodb').MongoClient;
const CONNECTION = config.MONGODB;
const DATABASE = config.DATABASE;

function DBConn(){};

/* 
    table:   需要创建的表名
    key:     索引字段 unique
*/
DBConn.createTable = function(table, key=[]) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) throw err;
            console.log(`|** DBConn.createTable <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.createCollection(table, function (err, res) {
                if (err) reject(err);
                // console.log(res);
                console.log(`table ${table} created!`);
                if(key.length != 0) {
                    let fieldOrSpec = {};
                    for(let i of key) {
                        fieldOrSpec[i] = 1;
                    }
                    dbase.collection(table).createIndex(fieldOrSpec, {unique: true}, function(err,res) {
                        if (err) reject(err);
                        db.close();
                        resolve('done');
                    });
                }
            });
        });
    });
}

// insert data if not exist
DBConn.insertData = function(table, data) {
    // console.log('|** DBConn.insertData **| total insert data num: ', data.length);
    return new Promise(function(resolve, reject){
        if(data.length == 0) {
            console.info(`|** DBConn.insertData <${table}> **| info: empty data`);
            resolve(0);
            return;
        }

        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log(`|** DBConn.insertData <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).insertMany(data, {ordered: false}, function(err, res) {
                if (err) {
                    if(err.result == undefined || err.result.result == undefined || err.result.result.ok != 1) {
                        console.log(`|** DBConn.insertData <${table}> **| error: `, err);
                        reject(err);
                    } else {
                        if(typeof(err.writeErrors) != 'undefined') {
                            console.log(`|** DBConn.insertData <${table}> **| conflict: \n`, err.writeErrors.map(msg => msg.errmsg));
                        }
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

DBConn.queryData = function(table, conditions = {}, size=100, skip=0) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log(`|** DBConn.queryData <${table}> **| db connect success ...`);
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
DBConn.updateData = function(table, operations) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) {
                reject(err);
                return;
            }
            console.log(`|** DBConn.updateData <${table}> **| db connect success ...`);
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

DBConn.dropTable = function(table) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) {
                reject(err);
                return;
            }
            console.log(`|** DBConn.dropTable <${table}> **| db connect success ...`);
            let dbase = db.db(DATABASE);

            dbase.collection(table).deleteMany({}, function(err, res) {
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

DBConn.count = function(table, conditions={}) {
    return new Promise(function(resolve, reject) {
        mongo.connect(CONNECTION, function(err, db) {
            if(err) {
                reject(err);
                return;
            }
            console.log(`|** DBConn.count <${table}> **| db connect success ...`);
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

DBConn.distinct = function(table, field={}) {
    return new Promise(function(resolve, reject) {
        mongo.connect(CONNECTION, function(err, db) {
            if(err) {
                reject(err);
                return;
            }
            console.log(`|** DBConn.distinct <${table}> **| db connect success ...`);
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

module.exports = DBConn;