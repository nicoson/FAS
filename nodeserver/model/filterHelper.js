const fs		        = require('fs');
const DBConn            = require('./DBConnection');
const CONCURRENT        = require('./concurrent');
const InferenceHelper   = require('./Inference');
const config            = require('./config');
const savepath          = config.UPLOAD_PATH;
const sconsole          = require('./sconsole');

let iHelp = new InferenceHelper(false);
// let ah = new appHelper();

class fileHandler {
    constructor(type) {
        this.judgeIllegal = (type == 'image') ? config.judgeIllegalImage : config.judgeIllegalVideo;
    }

    // get tasks in queue
    queryTasks(size, type='image') {
        sconsole.log('|** filterHelper.queryTasks **| INFO: query tasks from taskpool', new Date());
        let filter = {type: type, status:{$exists:false}, filter:{$exists:false}};
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
        sconsole.log(`|** filterHelper.switchTaskStatus **| INFO: update tasks' status in taskpool`, new Date());
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


    switchTaskFilter(rawdata, resData) {
        sconsole.log(`|** filterHelper.switchTaskFilter **| INFO: update tasks' status in taskpool`, new Date());
        let timestamp = (new Date()).getTime();
        let operations = [];
        for(let i in rawdata) {
            operations.push({
                updateOne: {
                    filter: {_id: rawdata[i]._id},
                    update: {$set: {
                        filter: resData[i],
                        update: timestamp
                    }}
                }
            });
        }

        sconsole.log(`|** filterHelper.switchTaskFilter **| INFO: update tasks' status in taskpool`, operations);
        return new Promise(function(resolve, reject) {
            DBConn.updateData('taskpool', operations).then(data => {
                sconsole.log(data)
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


    deleteTasks(rawdata, resdata) {
        sconsole.log('|** filterHelper.deleteTasks **| INFO: delete tasks from taskpool', new Date());
        let operations = [];
        for(let i in rawdata) {
            if(resdata[i]) {
                operations.push({
                    deleteMany: {
                        filter: {uid: rawdata[i].uid}
                    }
                });
            }
        }
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
        sconsole.log('|** filterHelper.deleteFiles **| INFO: delete files from temp dir', new Date());
        try{
            for(let i in rawdata) {
                if(resdata[i]) {
                    await fs.unlinkSync(`${savepath}/${rawdata[i].uri.split('/').slice(4).join('/')}`);
                }
            }
        }
        catch(err) {
            sconsole.log('|** filterHelper.deleteFiles **| INFO: delete files err: ', err);
        }
        
        return {code: 200};
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
        this.staticstic = {filter_badcall: 0, filter_legal: 0, filter_illegal: 0};
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
        let options = config.IMAGE_OPTIONS;
        options.uri = datum.uri;
        options.params = {"threshold": 0.6,"scenes": ["pulp","terror","politician","march","text"]}
        
        let res = await iHelp.censorCall(config.FILTERIMGAPI, JSON.stringify(options)).catch(err => sconsole.log('image inference err: ', err));
        sconsole.log(">>>>>>>> callImageJob inference result data: ", res);

        callBack({
            source: datum,
            res: res.pass
        });
    }

    async callVideoJob(callBack) {
        let datum = await this.getDatum();
        if(datum == null) return callBack(null);
        let options = config.VIDEO_OPTIONS;
        options.data.uri = datum.uri;
        let reqBody = JSON.stringify(options);
        let res = await iHelp.censorCall(config.CENSORVIDEOAPI, reqBody).catch(err => sconsole.log('video inference err: ', err));
        sconsole.log('|** callVideoJob **| res: ', res);

        callBack({
            source: datum,
            res: config.videoResFormat(res)
        });
    }

    //  独立运行解耦模块，单线程专门获取待处理数据集，只能由一个任务触发管理
    async feedDataQueue() {
        //  如果前一次轮询还未结束，那么跳过这次轮询
        console.log('-------------  trigger feed data: ', this.jobData.length, this.preload);
        if(this.jobData.length < (this.preload*3) && !this.fetching) {
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
        console.log('---------------    trigger consume function: current data length', data.length);
        if(data.length > 0) {
            sconsole.log('---------------    current output data: ', data);
            let temp = data.splice(0);
            let rawData = temp.map(datum => datum.source);
            let resData = temp.map(datum => datum.res);

            //  step 1: update data
            let res = await this.fh.switchTaskFilter(rawData, resData).catch(err => {sconsole.log('updateData err: ', err); return;});
            // let res = await this.fh.insertIllegal(rawData, resData).catch(err => {sconsole.log('insertIllegal err: ', err); return;});
            if(res.code == 500) {
                sconsole.log('insert insertIllegal data failed, abort now ...');
                return {code: 500, msg: 'insert insertIllegal data failed', status: 1};
            }
            sconsole.log("============>  insert fileinfo");

            //  step 2: delete task
            res = await this.fh.deleteTasks(rawData, resData).catch(err => {sconsole.log('deleteTasks err: ', err); return;});
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
                    this.staticstic.filter_badcall++;
                } else if(datum) {  // pass==true, means legal
                    this.staticstic.filter_legal++;
                } else {
                    this.staticstic.filter_illegal++;
                }
            });

            sconsole.log(`|** filterHelper.consume **| INFO: ${rawData.length} data were handled ...`, new Date());
            this.consumeFlag = true;
            return {
                code: 200,
                length: rawData.length,
                msg: `${rawData.length} data were handled ...`,
                status: 1
            };
        } else {
            sconsole.log(`|** filterHelper.consume **| INFO: no data to consume ...`, new Date());
        }
    }

    async sleep(period) {
        return new Promise(function(resolve, reject){
            setTimeout(function(){resolve(1)}, period);
        });
    }
}

// use UTC time zone
class filterHelper {
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

module.exports = filterHelper;