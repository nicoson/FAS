const fs		        = require('fs');
const DBConn            = require('./DBConnection');
// const DBConn            = require('./DBConnection_bk');
const CONCURRENT        = require('./concurrent');
const InferenceHelper   = require('./Inference');
const config            = require('./config');
// const appHelper         = require('../model/appHelper');
const savepath          = config.UPLOAD_PATH;
const sconsole          = require('./sconsole');

let iHelp = new InferenceHelper(false);
// let ah = new appHelper();

class fileHandler {
    constructor(type) {
        this.judgeIllegal = (type == 'image') ? this.judgeIllegalImage : this.judgeIllegalVideo;
    }

    // get tasks in queue
    queryTasks(size, type='image') {
        sconsole.log('|** deliverHelper.queryTasks **| INFO: query tasks from taskpool', new Date());
        let filter = {type: type, status:{$exists:false}};
        // sconsole.log('-------  query filter: ', filter);
        return new Promise(function(resolve, reject) {
            DBConn.queryData('taskpool', filter, size).then(data => {
                resolve({
                    code: 200,
                    data: data
                });
            }).catch(err => {
                reject({
                    code: 500,
                    msg: err
                });
            });
        });
    }

    // change tasks' status to 'locked' or null
    //      locked: task is lock inavoid of being taken;
    //      null: task is free for pick
    switchTaskStatus(data, lock='lock') {
        sconsole.log(`|** deliverHelper.switchTaskStatus **| INFO: update tasks' status in taskpool`, new Date());
        let timestamp = (new Date()).getTime();
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {_id: datum._id},
                update: {$set: {
                    status: lock,
                    update: timestamp
                }}
            }
        };});
        return new Promise(function(resolve, reject) {
            DBConn.updateData('taskpool', operations).then(data => {
                // sconsole.log(data)
                resolve({
                    code: 200,
                    data: data
                });
            }).catch(err => {
                reject({
                    code: 500,
                    msg: err
                });
            });
        });
    }


    deleteTasks(data) {
        sconsole.log('|** deliverHelper.deleteTasks **| INFO: delete tasks from taskpool', new Date());
        let operations = data.map(datum => {return {
            deleteMany: {
                filter: {uid: datum.uid}
            }
        };});
        return new Promise(function(resolve, reject) {
            DBConn.updateData('taskpool', operations).then(data => {
                // sconsole.log(data)
                resolve({
                    code: 200,
                    data: data
                });
            }).catch(err => {reject({code: 500,msg: err});});
        });
    }

    async deleteFiles(rawdata, resdata) {
        sconsole.log('|** deliverHelper.deleteFiles **| INFO: delete files from temp dir', new Date());
        try{
            for(let i in rawdata) {
                if(!this.judgeIllegal(resdata[i])) {
                    await fs.unlinkSync(`${savepath}/${rawdata[i].uid}`);
                }
            }
        }
        catch(err) {
            sconsole.log('|** deliverHelper.deleteFiles **| INFO: delete files err: ', err);
        }
        
        return {code: 200};
    }

    insertIllegal(rawdata, data) {
        sconsole.log('|** deliverHelper.insertIllegal **| INFO: insert data into file <illegal> table', new Date());
        let infoData = [];
        let timestamp = new Date();
        data.map((datum, ind) => {
            sconsole.log('=======> datum: ', datum);
            if(this.judgeIllegal(datum)) {
                infoData.push({
                    uid: rawdata[ind].uid,
                    create: rawdata[ind].create,
                    update: timestamp,
                    uri: rawdata[ind].uri,
                    type: rawdata[ind].type,
                    rets: datum,
                    info: rawdata[ind].info,
                    // filename: rawdata[ind].name,
                    manualreview: null,
                });
            }
        });

        // sconsole.log('infoData: ',infoData);

        return new Promise(function(resolve, reject) {
            if(infoData.length == 0) {
                sconsole.log('|** deliverHelper.insertIllegal **| INFO: no data inserted ...');
                resolve({code: 200, res: 0});
            } else {
                DBConn.insertData('illegal', infoData).then(res => {
                    // sconsole.log(res)
                    resolve({
                        code: 200,
                        res: res
                    });
                }).catch(err => {
                    reject({
                        code: 500,
                        msg: err
                    });
                });
            }
        });
    }

    insertFileMeta(data) {
        sconsole.log('|** deliverHelper.insertFileMeta **| INFO: insert data into file meta table', new Date());
        data.map(datum => {
            delete datum.status;
            datum.type = 'censor';
        });
        return new Promise(function(resolve, reject) {
            DBConn.insertData('filemeta', data).then(res => {
                resolve({
                    code: 200,
                    res: res
                });
            }).catch(err => {
                reject({
                    code: 500,
                    msg: err
                });
            });
        });
    }

    judgeIllegalImage(datum) {
        // illegal: true;  normal: false
        // sconsole.log('XXXXX test XXXX:  ', Object.keys(datum).length, datum.label, datum)
        return (datum != null && Object.keys(datum).length > 0 && datum.label == 1);
    }

    judgeIllegalVideo(datum) {
        // illegal: true;  normal: false
        return (datum.suggestion == 'block');
    }
}

// let fh = new fileHandler();
class job {
    constructor(preload=100, type='image') {
        this.preload = preload;
        this.jobData = [];
        this.fetching = false;
        this.type = type;
        this.callJob = (type == 'image') ? this.callImageJob : this.callVideoJob;
        this.staticstic = {badcall: 0, legal: 0, illegal: 0};
        // this.consumeFlag = true;
        this.consumeSize = (type == 'image') ? 100 : 1;
        this.fh = new fileHandler(type);
    }

    start() {
        this.starter = true;
    }

    stop() {
        this.starter = false;
    }

    async getDatum() {
        // 如果已经有其他 job 在请求数据了，那么等待
        let count = 0;
        while(this.jobData.length < 1) {
            sconsole.log('  ... waiting for fetching ...');
            await this.sleep(1000);
            count++;
            if (count > 3) return null; // 等待3秒后销毁该线程
        }
        return this.jobData.splice(0,1)[0];
    }

    async callImageJob(callBack) {
        let datum = await this.getDatum();
        if(datum == null) return callBack(null);
        let reqBody = JSON.stringify({
            "data": {
                "uri": datum.uri
            },
            "params": config.CENSOR_PARAM
        });
        let res = await iHelp.censorCall(config.CENSORIMGAPI, reqBody).catch(err => sconsole.log('image inference err: ', err));
        // sconsole.log('res: ', res);
        if(res.code == 0) {
            callBack({
                source: datum,
                res: res.result
            });
        } else {
            callBack({
                source: datum,
                res: null
            });
        }
    }

    async callVideoJob(callBack) {
        let datum = await this.getDatum();
        if(datum == null) return callBack(null);
        let reqBody = JSON.stringify({
            "data": {
                "uri": datum.uri
            },
            "params": {
                "scenes": [
                    "pulp",
                    "terror",
                    "politician"
                ],
                "cut_param": {
                    "interval_msecs": 5000
                }
            }
        });
        let res = await iHelp.censorCall(config.CENSORVIDEOAPI, reqBody).catch(err => sconsole.log('video inference err: ', err));
        sconsole.log('|** callVideoJob **| res: ', res);
        if(res.code == 200) {
            callBack({
                source: datum,
                res: res.result
            });
        } else {
            callBack({
                source: datum,
                res: null
            });
        }
    }

    //  独立运行解耦模块，单线程专门获取待处理数据集，只能由一个任务触发管理
    async feedDataQueue() {
        //  如果前一次轮询还未结束，那么跳过这次轮询
        sconsole.log('-------------  trigger feed data: ', this.jobData.length, this.preload);
        if(this.jobData.length < (this.preload/2) && !this.fetching) {
            this.fetching = true;
            let data = (await this.fh.queryTasks(this.preload, this.type)).data;
            // sconsole.log('------   fetch data: ', data);
            if(data.length > 0) {
                await this.fh.switchTaskStatus(data);
                this.jobData.push(...data);
                sconsole.log(`            ... fetch: ${this.jobData.length} jobs ...`);
            } else {
                // 等下一次轮询
            }
            this.fetching = false;
        }
    }

    //  独立运行解耦模块，单线程专门处理结果数据集，只能由一个任务触发管理
    async consume(data) {
        sconsole.log('---------------    trigger consume function: current data length', data.length);
        if(data.length > 0) {
            sconsole.log('---------------    current output data: ', data);
            let temp = data.splice(0);
            let rawData = temp.map(datum => datum.source);
            let resData = temp.map(datum => datum.res);

            //  step 1: insert data
            let res = await this.fh.insertIllegal(rawData, resData).catch(err => {sconsole.log('insertIllegal err: ', err); return;});
            if(res.code == 500) {
                sconsole.log('insert insertIllegal data failed, abort now ...');
                return {code: 500, msg: 'insert insertIllegal data failed', status: 1};
            }
            sconsole.log("============>  insert fileinfo");

            //  step 2: delete task
            res = await this.fh.deleteTasks(rawData).catch(err => {sconsole.log('deleteTasks err: ', err); return;});
            if(res.code == 500) {
                sconsole.log('delete pooling data failed, abort now ...');
                return {code: 500, msg: 'delete pooling data failed', status: 1};
            }

            //  step 3: delete file
            res = await this.fh.deleteFiles(rawData, resData).catch(err => {sconsole.log('deleteFiles err: ', err); return;});
            if(res.code == 500) {
                sconsole.log('delete file failed, abort now ...');
                return {code: 500, msg: 'delete file failed', status: 1};
            }

            //  step 4: update statistic
            resData.map(datum => {
                if(datum == null) {
                    this.staticstic.badcall++;
                } else if(!this.fh.judgeIllegal(datum)) {
                    this.staticstic.legal++;
                } else {
                    this.staticstic.illegal++;
                }
            });

            sconsole.log(`|** deliverHelper.consume **| INFO: ${rawData.length} data were handled ...`, new Date());
            this.consumeFlag = true;
            return {
                code: 200,
                length: rawData.length,
                msg: `${rawData.length} data were handled ...`,
                status: 1
            };
        } else {
            sconsole.log(`|** deliverHelper.consume **| INFO: no data to consume ...`, new Date());
        }
    }

    async sleep(period) {
        return new Promise(function(resolve, reject){
            setTimeout(function(){resolve(1)}, period);
        });
    }
}

// use UTC time zone
class deliverHelper {
    constructor(concurrency=10, preload=200, type='image') {
        this.job = new job(preload, type)
        this.worker = new CONCURRENT(concurrency, this.job);
    }

    auditStart() {
        this.worker.run();
    }

    auditStop() {
        this.worker.stop();
    }

    getStatistics() {
        return this.job.staticstic;
    }
}



module.exports = deliverHelper;