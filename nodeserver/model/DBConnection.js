//connection to database
const config = require('./config');
const mongo = require('mongodb').MongoClient;
const CONNECTION = config.MONGODB;
const DATABASE = config.DATABASE;

class DBConn {
    constructor() {
        this.connectionPool = null;
        this.status = new Promise(function(resolve, reject) {
            mongo.connect(CONNECTION, {useNewUrlParser: true, poolSize: 100}, function(err, db) {
                console.log(`|** DBConn connect pool **| db connect pool create success ...`);
                this.connectionPool = db;
                resolve('done');
            }.bind(this));
        }.bind(this));
    }

    init() {
    }
    /* 
        table:   需要创建的表名
        key:     索引字段 unique
    */
    createTable(table, key=[]) {
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
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
                            resolve('done');
                        });
                    }
                });
            });
        }.bind(this));
    }
    
    // insert data if not exist
    insertData(table, data) {
        // console.log('|** DBConn.insertData **| total insert data num: ', data.length);
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                if(data.length == 0) {
                    console.info(`|** DBConn.insertData <${table}> **| info: empty data`);
                    resolve(0);
                    return;
                }
        
                let dbase = this.connectionPool.db(DATABASE);
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
                    return
                });
            });
        }.bind(this));
    }
    
    queryData(table, conditions = {}, size=100, skip=0) {
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                // console.log('==============>   this: ',this)
                let dbase = this.connectionPool.db(DATABASE);
                dbase.collection(table).find(conditions).sort({_id:1}).skip(skip).limit(size).toArray(function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            });
        }.bind(this));
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
    updateData(table, operations) {
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
                dbase.collection(table).bulkWrite(operations, {ordered: false}, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            });
        }.bind(this));
    }
    
    dropTable(table) {
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
                dbase.collection(table).deleteMany({}, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            });
        }.bind(this));
    }
    
    count(table, conditions={}) {
        return new Promise(function(resolve, reject) {
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
                dbase.collection(table).count(conditions, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            });
        }.bind(this));
    }
    
    distinct(table, field={}) {
        return new Promise(function(resolve, reject) {
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
                dbase.collection(table).distinct(field, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res.length);
                    }
                    return
                });
            });
        }.bind(this));
    }
};







module.exports = DBConn;