const sconsole  = require('./sconsole');
const DBConn    = require('./DBConnection');
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

        //  settle for get raw data
        // 共享一个promise，所有后续的请求全部走该promise，减少重复请求
        // 设置一个超时时间，防止单实例挂掉，增加系统鲁棒性
        this.isRender = false;
        this.renderTimer = null;
        this.renderProcess = null; // a promise body
    }

    init() {

    }

    // get files from <videos> table
    async getDataFromDB(conditions={}, size=50, skip=0, order=1) {
        sconsole.log('|** appHelper.getDataFromDB **| INFO: get data from <videos> table for list view| ', new Date());
        let res = await DBConn.queryData('illegal', conditions, size, skip, order).catch(err => {sconsole.log(err); return []});
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
        this.removeFiles(data);

        sconsole.log('db operation result: ', res);
        return res;
    }

    async removeFiles(data) {
        sconsole.info('|** appHelper.removeFiles **| INFO: remove files from temp dir', new Date());
        try{
            for(let i=0; i<data.length; i++) {
                if(data[i].manualreview == false) {
                    await fs.unlinkSync(`${savepath}/${data[i].uri.split('/').slice(4).join('/')}`);
                }
            }
        }
        catch(err) {
            sconsole.error('|** appHelper.removeFiles **| INFO: remove files err: ', err);
        }
        
        return {code: 200};
    }

    async getRawData(req) {
        let size = req.body.size;
        let type = req.body.mimeType

        // 当且仅当，已经有用户请求了，并且该请求尚未超时时，后续请求的用户需要等待
        if(this.isRender && (new Date().getTime() - this.renderTimer) < 30000) {
            sconsole.log("........ customer: waiting for render ........");
            await this.renderProcess;
            // await this.sleep(1);    // wait for data handle below
            sconsole.log("........ customer: got from render ........");
        } else if (this.taskPool[type].length < size) {
            sconsole.log("........ owner: waiting for render ........");
            this.renderTimer = new Date().getTime();
            this.isRender = true;
            this.renderProcess = this.queryRawData(type, this.poolsize, 0, -1);
            let data = await this.renderProcess;
            this.taskPool[type+'num'] = data.num;
            this.taskPool[type] = data.res;
            this.isRender = false;
            sconsole.log("........ owner: got from render ........");
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

    // async reloadData(type, size=100, skip=0) {
    //     let data = await this.queryRawData(type, size, skip);
    //     this.taskPool[type+'num'] = data.num;
    //     this.taskPool[type].push(...data.res);
    //     return 'done';
    // }

    async queryRawData(type, size, skip=0, order=1) {
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
        let data = await this.getDataFromDB(conditions, size, skip, order).catch(err => sconsole.log(`|** appHelper.queryRawData **| ERROR: get raw data error: ${err}| `, new Date()));
        console.log('=================>   inner layer query costs: ', new Date().getTime()-starter);
        // await this.sleep(20000);
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
                        taskpoolNum: res[0],
                        taskpoolImageNum: res[1],
                        taskpoolVideoNum: res[2],
                        allIllegalNum: res[3],
                        allIllegalImageNum: res[4],
                        allIllegalVideoNum: res[5],
                        auditIllegalImageNum: res[6],
                        auditIllegalVideoNum: res[7],
                        rawIllegalImageNum: res[8],
                        rawIllegalVideoNum: res[9]
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
        return res.length == 0 ? {imgCount:0, imgRequest:0, vidCount:0} : res[0];
    }

    updateStatistic(key, data) {
        let operations = [{
            updateOne: {
                filter: {name: key},
                update: {$set: {
                    imgCount        : data.imgCount,
                    imgRequest      : data.imgRequest,
                    vidCount        : data.vidCount,
                    imgDetail		: data.imgDetail,
                    imgFilterDetail	: data.imgFilterDetail,
                    videoDetail		: data.videoDetail,
                    update          : new Date()
                }},
                upsert: true
            }
        }];
        DBConn.updateData('statistic', operations);
        return 'done';
    }

    updateHistory(date, hour, data) {
        let operations = [{
            updateOne: {
                filter: {date: date, hour: hour},
                update: {$set: {
                    date        : date,
                    hour        : hour,
                    requests    : data.imgRequest,
                    handle      : data.imgCount,
                    update      : new Date()
                }},
                upsert: true
            }
        }];
        DBConn.updateData('history', operations);
        return 'done';
    }

    async sleep(period) {
        return new Promise(function(resolve, reject){
            setTimeout(function(){resolve(1)}, period);
        });
    }
}

module.exports = appHelper;