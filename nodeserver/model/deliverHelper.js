const fs		        = require('fs');
const DBConn            = require('./DBConnection');
const InferenceHelper   = require('./Inference');
const config            = require('./config');
const savepath          = config.UPLOAD_PATH;

let iHelp = new InferenceHelper(false);

// use UTC time zone
class deliverHelper {
    constructor() {
        this.init();
    }

    init() {
    }

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
        for(let i in rawdata) {
            if(resdata[i].label == 0) {
                await fs.unlink(`${savepath}/${rawdata[i].uid}`);
            }
        }
        return {code: 200};
    }

    insertIllegal(rawdata, data) {
        console.log('|** deliverHelper.insertIllegal **| INFO: insert data into file <illegal> table', new Date());
        let infoData = [];
        let timestamp = new Date();
        data.map((datum, ind) => {
            if(datum.label == 1) {
                infoData.push({
                    uid: rawdata[ind].uid,
                    create: rawdata[ind].create,
                    update: timestamp,
                    uri: rawdata[ind].uri,
                    type: rawdata[ind].type,
                    rets: datum,
                    manualreview: null,
                    illegal: datum.label == 1 ? true : false
                });
            }
        });

        console.log('infoData: ',infoData);

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

    //  status:
    //      0: task pool empty
    //      1: task pool not empty
    async atomProcess(size=20) {
        //  step 1: query data
        let queueData = await this.queryTasks(size);
        if(queueData.code == 500) {
            console.log('get task failed, try again later ...');
            setTimeout(() => this.atomProcess(), 2000);
            return {code: 500, msg: 'get task failed', status: 1};
        } else if(queueData.data.length == 0) {
            console.log('task pool empty');
            return {
                code: 200,
                length: queueData.data.length,
                msg: 'task pool empty',
                status: 0
            };
        }

        //  step 2: audit data
        let resData = await iHelp.censorBatch(queueData.data).catch(err => {console.log('inference err: ', err); return;});
        console.log('resData: ', resData);
        if(resData.code == 500) {
            console.log('call api failed, abort now ...');
            return;
        }
        
        //  step 3: insert data
        let res = await this.insertIllegal(queueData.data, resData.data).catch(err => {console.log('insertIllegal err: ', err); return;});
        console.log('xx res: ', res);
        if(res.code == 500) {
            console.log('insert insertIllegal data failed, abort now ...');
            return {code: 500, msg: 'insert insertIllegal data failed', status: 1};
        }
        console.log("============>  insert fileinfo");

        //  step 4: delete task
        res = await this.deleteTasks(queueData.data).catch(err => {console.log('deleteTasks err: ', err); return;});
        if(res.code == 500) {
            console.log('delete pooling data failed, abort now ...');
            return {code: 500, msg: 'delete pooling data failed', status: 1};
        }

        //  step 5: delete file
        res = await this.deleteFiles(queueData.data, resData.data).catch(err => {console.log('deleteFiles err: ', err); return;});
        if(res.code == 500) {
            console.log('delete file failed, abort now ...');
            return {code: 500, msg: 'delete file failed', status: 1};
        }

        console.log(`|** deliverHelper.atomProcess **| INFO: ${queueData.data.length} data were handled ...`, new Date());
        return {
            code: 200,
            length: queueData.data.length,
            msg: `${queueData.data.length} data were handled ...`,
            status: 1
        };
    }

    processBatchImg(interval=200) {
        setTimeout(function(){
            this.atomProcess(20).then(e => {
                console.log('processBatch: continue');
                if(e.status == 1) {
                    this.processBatchImg();
                } else {
                    console.log('processBatch: no data waiting ...');
                    this.processBatchImg(10000);
                }
            });
        }.bind(this), interval);
    }

    processBatchVideo(interval=200) {
        setTimeout(function(){
            this.videoProcess(1).then(e => {
                console.log('processBatch: continue');
                if(e.status == 1) {
                    this.processBatchVideo();
                } else {
                    console.log('processBatch: no data waiting ...');
                    this.processBatchVideo(10000);
                }
            });
        }.bind(this), interval);
    }

    async videoProcess(size=1) {
        //  step 1: query task
        let task = await this.queryTasks(size,'video');
        if(task.code == 500) {
            console.log('get video task failed, try again later ...');
            setTimeout(() => this.videoProcess(), 1000);
            return {code: 500, msg: 'get task failed', status: 1};
        } else if(task.data.length == 0) {
            console.log('video pool empty');
            return {
                code: 200,
                length: task.data.length,
                msg: 'video pool empty',
                status: 0
            };
        }

        //  step 2: audit task
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
        let resData = await iHelp.censorCall(config.CENSORVIDEOAPI, reqBody).catch(err => {console.log('inference err: ', err); return;});
        console.log('resData: ', resData);
        if(typeof(resData.result) == 'undefined') {
            console.log('call api failed, abort now ...');
            return {code: 500, msg: 'audit video failed', status: 1};
        }

        //  step 3: insert result
        resData.label = (resData.result.suggestion == 'pass') ? 0 : 1;
        let res = await this.insertIllegal(task.data, [resData]).catch(err => {console.log('insertFileInfo err: ', err); return;});
        if(res.code == 500) {
            console.log('insert fileinfo data failed, abort now ...');
            return {code: 500, msg: 'insert fileinfo data failed', status: 1};
        }
        console.log("insert fileinfo");
        
        //  step 4: delete task
        res = await this.deleteTasks(task.data).catch(err => {console.log('deleteTasks err: ', err); return;});
        if(res.code == 500) {
            console.log('delete pooling data failed, abort now ...');
            return {code: 500, msg: 'delete pooling data failed', status: 1};
        }

        //  step 5: delete file
        res = await this.deleteFiles(task.data, [resData]).catch(err => {console.log('deleteTasks err: ', err); return;});
        if(res.code == 500) {
            console.log('delete file failed, abort now ...');
            return {code: 500, msg: 'delete file failed', status: 1};
        }

        console.log(`|** deliverHelper.videoProcess **| INFO: ${task.data.length} data were handled ...`, new Date());
        return {
            code: 200,
            length: task.data.length,
            msg: `${task.data.length} data were handled ...`,
            status: 1
        };
    }
}

module.exports = deliverHelper;