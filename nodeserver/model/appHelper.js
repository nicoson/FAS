const DBConn    = require('./DBConnection');
const config    = require('./config');

// use UTC time zone
class appHelper {
    constructor() {
        this.init();
    }

    init() {

    }

    // get files from <videos> table
    async getDataFromDB(conditions={}, size=50, skip=0) {
        console.log('|** appHelper.getDataFromDB **| INFO: get data from <videos> table for list view| ', new Date());
        let res = await DBConn.queryData('illegal', conditions, size, skip).catch(err => {console.log(err); return []});
        let num = await DBConn.count('illegal', conditions).catch(err => {console.log(err); return []});
        return {
            num: num,
            res: res
        };
    }

    // update data into table
    async updateDataIntoTable(table, data) {
        console.log(`|** appHelper.updateDataIntoTable **| INFO: update data into <${table}> table| `, new Date());
        if(data.length == 0) return 0;
        
        let timestamp = new Date();
        let operations = data.map(datum => {
            return {
                updateMany: {
                    filter: {uid: datum.uid},
                    update: {$set: {
                        manualreview: datum.manualreview,
                        update: timestamp
                    }}
                }
            };
        });

        console.log(JSON.stringify(operations));
        let res = await DBConn.updateData(table, operations).catch(err => {console.log(err); return err});
        console.log('db operation result: ', res)
        return res;
    }

    getSystemStatus() {
        try{
            return new Promise(function(resolve, reject) {
                let p = [
                    DBConn.count('taskpool'),
                    DBConn.count('taskpool', {type: 'image'}),
                    DBConn.count('taskpool', {type: 'video'}),
                    DBConn.count('illegal'),
                    DBConn.count('illegal', {type: 'image'}),
                    DBConn.count('illegal', {type: 'video'}),
                    DBConn.count('illegal', {$and:[{type: 'image'}, {manualreview: true}]}),
                    DBConn.count('illegal', {$and:[{type: 'video'}, {manualreview: true}]}),
                    DBConn.count('illegal', {$and:[{type: 'image'}, {manualreview: null}]}),
                    DBConn.count('illegal', {$and:[{type: 'video'}, {manualreview: null}]})
                ];
                Promise.all(p).then(res => {
                    resolve({
                        taskpoolnum: res[0],
                        taskpoolimagenum: res[1],
                        taskpoolvideonum: res[2],
                        fileinfonum: res[3],
                        fileinfoimagenum: res[4],
                        fileinfovideonum: res[5],
                        illegalimage: res[6],
                        illegalvideo: res[7],
                        waitimage: res[8],
                        waitvideo: res[9]
                    });
                }).catch(err => reject(err));
            });
        }
        catch(err) {
            reject(err);
        }
    }

    async getStatistic(key) {
        let res = await DBConn.queryData('statistic', {name: key}, 1, 0);
        console.log("res: ", res);
        return res.length == 0 ? 0 : res[0].number;
    }

    updateStatistic(key, data) {
        let operations = [{
            updateOne: {
                filter: {name: key},
                update: {$set: {
                    number: data,
                    update: new Date()
                }},
                upsert: true
            }
        }];
        DBConn.updateData('statistic', operations);
        return 'done';
    }
}

module.exports = appHelper;