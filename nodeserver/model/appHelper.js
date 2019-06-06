const sconsole      = require('./sconsole');
const DBConn  = require('./DBConnection');
// const DBConn  = require('./DBConnection_bk');

// use UTC time zone
class appHelper {
    constructor() {
        this.init();
        this.taskPool = {
            image: [],
            imagenum: 0,
            video: [],
            videonum: 0
        }
        this.poolsize = 2000;
        this.ratio = 0.2;
    }

    init() {

    }

    // get files from <videos> table
    async getDataFromDB(conditions={}, size=50, skip=0) {
        sconsole.log('|** appHelper.getDataFromDB **| INFO: get data from <videos> table for list view| ', new Date());
        let res = await DBConn.queryData('illegal', conditions, size, skip).catch(err => {sconsole.log(err); return []});
        let num = await DBConn.count('illegal', conditions).catch(err => {sconsole.log(err); return []});
        return {
            num: num,
            res: res
        };
    }

    // update data into table
    async updateDataIntoTable(table, data) {
        sconsole.log(`|** appHelper.updateDataIntoTable **| INFO: update data into <${table}> table| `, new Date());
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

        sconsole.log(JSON.stringify(operations));
        let res = await DBConn.updateData(table, operations).catch(err => {sconsole.log(err); return err});
        sconsole.log('db operation result: ', res)
        return res;
    }

    async getRawData(req) {
        let size = req.body.size;
        let type = req.body.mimeType

        if (this.taskPool[type].length < size) {
            let data = await this.queryRawData(type, this.poolsize);
            this.taskPool[type+'num'] = data.num;
            this.taskPool[type] = data.res;
        // } else if(this.taskPool[type].length < this.poolsize * 0.5){
        //     this.reloadData(type, this.poolsize * 0.5, this.taskPool[type].length).then(e => sconsole.log('reload done'));
        } else {
            sconsole.log(`......... use cache ......... ${this.taskPool[type].length} data still left`);
        }

        return {
            code: 200,
            data: this.taskPool[type].splice(0, size),
            num: this.taskPool[type+'num']
        }
    }

    async reloadData(type, size=100, skip=0) {
        let data = await this.queryRawData(type, size, skip);
        this.taskPool[type+'num'] = data.num;
        this.taskPool[type].push(...data.res);
        return 'done';
    }

    async queryRawData(type, size, skip=0) {
        let conditions = {
            $and: [
                {manualreview: null},
                {type: type}
            ]
        }

        let ops = [];
        ops.push({'rets.scenes.pulp.suggestion': 'block'});
        ops.push({'rets.scenes.terror.suggestion': 'block'});
        ops.push({'rets.scenes.politician.suggestion': {$ne:"pass"}});
        conditions.$and.push({$or: ops});
        
        sconsole.log('conditions: ', JSON.stringify(conditions));
        let starter = new Date().getTime();
        let data = await this.getDataFromDB(conditions, size, skip).catch(err => sconsole.log(`|** appHelper.queryRawData **| ERROR: get raw data error: ${err}| `, new Date()));
        console.log('=================>   inner layer query costs: ', new Date().getTime()-starter);
        return data;
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
        // sconsole.log("res: ", res);
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