//connection to database
const config        = require('./config');
const mongo         = require('mongodb').MongoClient;
const sconsole      = require('./sconsole');
const CONNECTION    = config.MONGODB;
const DATABASE      = config.DATABASE;

class DBConn {
    constructor() {
        this.connectionPool = null;
        this.status = null;
        this.initFlag = false;
        this.init();
    }

    init() {
        if(this.connectionPool != null) {
            this.connectionPool.close();
            this.status = null;
            sconsole.info("==============>  DB now is destoried ... ...");
        }
        if(!this.initFlag) {
            this.initFlag = true;
            this.status = new Promise(function(resolve, reject) {
                mongo.connect(CONNECTION, {useNewUrlParser: true, poolSize: 100}, function(err, db) {
                    if(err) {
                        sconsole.error("\n\n==============>  DBConn.init(): DB now is broken ... ...\n            error info: ", err, '\n\n');
                        reject(err);
                    } else {
                        sconsole.info(`|** DBConn connect pool **| db connect pool create success ...`);
                        this.connectionPool = db;
                        resolve('done');
                    }
                    this.initFlag = false;
                }.bind(this));
            }.bind(this));
        } else {
            sconsole.info("==============>  DB now is being starting ... ...");
        }
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
                    // sconsole.log(res);
                    sconsole.log(`table ${table} created!`);
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
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    // insert data if not exist
    insertData(table, data) {
        // sconsole.log('|** DBConn.insertData **| total insert data num: ', data.length);
        return new Promise(function(resolve, reject){
            if(!this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
            this.status.then(() => {
                if(data.length == 0) {
                    sconsole.info(`|** DBConn.insertData <${table}> **| info: empty data`);
                    resolve(0);
                    return;
                }
        
                let dbase = this.connectionPool.db(DATABASE);
                dbase.collection(table).insertMany(data, {ordered: false}, function(err, res) {
                    if (err) {
                        if(err.result == undefined || err.result.result == undefined || err.result.result.ok != 1) {
                            sconsole.error(`|** DBConn.insertData <${table}> **| error: `, err);
                            reject(err);
                        } else {
                            if(typeof(err.writeErrors) != 'undefined') {
                                sconsole.error(`|** DBConn.insertData <${table}> **| conflict: \n`, err.writeErrors.map(msg => msg.errmsg));
                            }
                            resolve(err.result.result.nInserted);
                        }
                    } else {
                        resolve(res.insertedCount);
                    }
                    return
                });
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    queryData(table, conditions = {}, size=100, skip=0, order=1) {
        return new Promise(function(resolve, reject){
            this.status.then(() => {
                console.log('==============>  DBCon: Connection is Connected: ',this.connectionPool.topology.isConnected());
                if(!this.connectionPool.topology.isConnected()) {
                    reject('DBCon connection lost ... ...');
                    this.errorHandler('');
                    return
                }
                
                let dbase = this.connectionPool.db(DATABASE);
                dbase.collection(table).find(conditions).sort({_id:order}).skip(skip).limit(size).toArray(function(err, res) {
                    sconsole.log('==============-- ->  DBConn queryData err: ', err);
                    if (err) {
                        // this.errorHandler(err);
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                }.bind(this));
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    queryDataCol(table, condition, col={_id:0,uid:1}) {
        return new Promise(function(resolve, reject){
            if(this.connectionPool !== null && !this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
            this.status.then(() => {
                // sconsole.log('==============>   this: ',this)
                let dbase = this.connectionPool.db(DATABASE);
                dbase.collection(table).find(condition).project(col).toArray(function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
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
            if(this.connectionPool !== null && !this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
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
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    dropTable(table) {
        return new Promise(function(resolve, reject){
            if(this.connectionPool !== null && !this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
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
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    count(table, conditions={}) {
        return new Promise(function(resolve, reject) {
            if(this.connectionPool !== null && !this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
            this.status.then(() => {
                let dbase = this.connectionPool.db(DATABASE);
    
                dbase.collection(table).countDocuments(conditions, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                    return
                });
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }
    
    distinct(table, field={}) {
        return new Promise(function(resolve, reject) {
            if(this.connectionPool !== null && !this.connectionPool.topology.isConnected()) {
                reject('DBCon connection lost ... ...');
                this.errorHandler('');
                return
            }
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
            }).catch(err => {
                // sconsole.error('==============>  DBCon: queryData status error: ', err);
                reject(err);
            });
        }.bind(this));
    }

    errorHandler(err) {
        this.init();
    }
};


// Singleton Pattern
let DBConnection = new DBConn();

module.exports = DBConnection;