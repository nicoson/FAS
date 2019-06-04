const fs		        = require('fs');
const DBConnection      = require('./DBConnection');
const CONCURRENT        = require('./concurrent');
const InferenceHelper   = require('./Inference');
const config            = require('./config');
const appHelper         = require('../model/appHelper');
const savepath          = config.UPLOAD_PATH;

let iHelp   = new InferenceHelper(false);
let DBConn  = new DBConnection();
let ah      = new appHelper();


class fileHandler {
    constructor() {}

    // get tasks in queue
    queryTasks(size, type='image') {
        console.log('|** deliverHelper.queryTasks **| INFO: query tasks from taskpool', new Date());
        let filter = {type: type};
        console.log(filter);
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
    switchTaskStatus(data, lock = null) {
        console.log(`|** deliverHelper.updateTasks **| INFO: update tasks' status in taskpool`, new Date());
        let timestamp = (new Date()).getTime();
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {md5: datum.md5},
                update: {$set: {
                    status: lock,
                    update: timestamp
                }}
            }
        };});
        return new Promise(function(resolve, reject) {
            DBConn.updateData('taskpool', operations).then(data => {
                // console.log(data)
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
        console.log('|** deliverHelper.deleteTasks **| INFO: delete tasks from taskpool', new Date());
        let operations = data.map(datum => {return {
            deleteMany: {
                filter: {uid: datum.uid}
            }
        };});
        return new Promise(function(resolve, reject) {
            DBConn.updateData('taskpool', operations).then(data => {
                // console.log(data)
                resolve({
                    code: 200,
                    data: data
                });
            }).catch(err => {reject({code: 500,msg: err});});
        });
    }

    async deleteFiles(rawdata, resdata) {
        console.log('|** deliverHelper.deleteFiles **| INFO: delete files from temp dir', new Date());
        try{
            for(let i in rawdata) {
                if(!this.judgeIllegal(resdata[i])) {
                    await fs.unlinkSync(`${savepath}/${rawdata[i].uid}`);
                }
            }
        }
        catch(err) {
            console.log('|** deliverHelper.deleteFiles **| INFO: delete files err: ', err);
        }
        
        return {code: 200};
    }

    insertIllegal(rawdata, data) {
        console.log('|** deliverHelper.insertIllegal **| INFO: insert data into file <illegal> table', new Date());
        let infoData = [];
        let timestamp = new Date();
        data.map((datum, ind) => {
            console.log('=======> datum: ', datum);
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

        // console.log('infoData: ',infoData);

        return new Promise(function(resolve, reject) {
            if(infoData.length == 0) {
                console.log('|** deliverHelper.insertIllegal **| INFO: no data inserted ...');
                resolve({code: 200, res: 0});
            } else {
                DBConn.insertData('illegal', infoData).then(res => {
                    // console.log(res)
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
        console.log('|** deliverHelper.insertFileMeta **| INFO: insert data into file meta table', new Date());
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

    judgeIllegal(datum) {
        // illegal: true;  normal: false
        // console.log('XXXXX test XXXX:  ', Object.keys(datum).length, datum.label, datum)
        return (datum != null && Object.keys(datum).length > 0 && datum.label == 1);
    }
}

let fh = new fileHandler();
class job {
    constructor(preload=100, type='image') {
        this.preload = preload;
        this.data = [];
        this.fetching = false;
        this.type = type;
        this.callJob = (type == 'image') ? this.callImageJob : this.callVideoJob;
        this.staticstic = {badcall: 0, legal: 0, illegal: 0};
    }

    start() {
        this.starter = true;
    }

    stop() {
        this.starter = false;
    }

    async getDatum() {
        // 如果已经有其他 job 在请求数据了，那么等待
        while(this.fetching) {
            console.log('  ... waiting for fetching ...');
            await this.sleep(1000);
        }
        if(this.data.length < 1) {
            this.fetching = true;
            while(this.fetching) {
                this.data = (await fh.queryTasks(this.preload,this.type)).data;
                // 如果取不到数据，那么等待多一会儿
                if(this.data.length > 0) {
                    this.fetching = false;
                } else {
                    await this.sleep(10000);
                }
            }
            
            // console.log('data: ',this.data);
            console.log(`            ... fetch: ${this.data.length} jobs ...`);
        }
        return this.data.splice(0,1)[0];
    }

    async callImageJob(callBack) {
        let datum = await this.getDatum();
        let reqBody = JSON.stringify({
            "data": {
                "uri": datum.uri
            },
            "params": {
                "detail": true,
                "type": "internet_terror"
            }
        });
        let res = await iHelp.censorCall(config.CENSORIMGAPI, reqBody).catch(err => console.log('image inference err: ', err));
        // console.log('res: ', res);
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
        let reqBody = JSON.stringify({
            "data": {
                "uri": task.data[0].uri
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
        let res = await iHelp.censorCall(config.CENSORVIDEOAPI, reqBody).catch(err => console.log('video inference err: ', err));
        // console.log('res: ', res);
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

    async consume(data) {
        let size = Math.min(100, Math.ceil(this.preload * 0.3));
        if(data.length > size) {
            let temp = data.splice(0, size);
            let rawData = temp.map(datum => datum.source);
            let resData = temp.map(datum => datum.res);
            console.log('---------------    current output data number: ', data.length);

            //  step 1: insert data
            let res = await fh.insertIllegal(rawData, resData).catch(err => {console.log('insertIllegal err: ', err); return;});
            if(res.code == 500) {
                console.log('insert insertIllegal data failed, abort now ...');
                return {code: 500, msg: 'insert insertIllegal data failed', status: 1};
            }
            console.log("============>  insert fileinfo");

            //  step 2: delete task
            res = await fh.deleteTasks(rawData).catch(err => {console.log('deleteTasks err: ', err); return;});
            if(res.code == 500) {
                console.log('delete pooling data failed, abort now ...');
                return {code: 500, msg: 'delete pooling data failed', status: 1};
            }

            //  step 3: delete file
            res = await fh.deleteFiles(rawData, resData).catch(err => {console.log('deleteFiles err: ', err); return;});
            if(res.code == 500) {
                console.log('delete file failed, abort now ...');
                return {code: 500, msg: 'delete file failed', status: 1};
            }

            //  step 4: update statistic
            resData.map(datum => {
                if(datum == null) {
                    this.staticstic.badcall++;
                } else if(!fh.judgeIllegal(datum)) {
                    this.staticstic.legal++;
                } else {
                    this.staticstic.illegal++;
                }
            });

            console.log(`|** deliverHelper.consume **| INFO: ${rawData.length} data were handled ...`, new Date());
            return {
                code: 200,
                length: rawData.length,
                msg: `${rawData.length} data were handled ...`,
                status: 1
            };
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

    auditImgStart() {
        this.worker.run();
    }

    auditImgStop() {
        this.worker.stop();
    }

    getStatistics() {
        return this.job.staticstic;
    }
}



module.exports = deliverHelper;