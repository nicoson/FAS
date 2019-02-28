const DBConn            = require('./DBConnection');
const InferenceHelper   = require('./Inference');
const config            = require('./config');

let iHelp = new InferenceHelper(false);

// use UTC time zone
class deliverHelper {
    constructor() {
        this.init();
    }

    init() {
        // DBConn.createTable('taskpool', 'md5').then(e => console.log(e));
        // DBConn.createTable('fileinfo', 'md5').then(e => console.log(e));
        // DBConn.createTable('filemeta', 'uid').then(e => console.log(e));
    }

    // get tasks in queue
    queryTasks(size, type=null) {
        console.log('|** deliverHelper.queryTasks **| INFO: query tasks from taskpool', new Date());
        let filter = {$and:[{status: null}]};
        if(type == 'image') {
            filter['$and'].push({filetype: 'image'});
        } else if(type == 'video') {
            filter['$and'].push({filetype: 'video'});
        }
        console.log(filter);
        return new Promise(function(resolve, reject) {
            DBConn.queryData('taskpool', filter, size).then(data => {
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
                filter: {md5: datum.md5}
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

    insertFileInfo(rawdata, data) {
        console.log('|** deliverHelper.insertFileInfo **| INFO: insert data into file info table', new Date());
        let infoData = [];
        let timestamp = (new Date()).getTime();
        data.map((datum, ind) => {
            infoData.push({
                md5: rawdata[ind].md5,
                create: rawdata[ind].create,
                update: timestamp,
                filepath: rawdata[ind].filepath,
                filetype: rawdata[ind].filetype,
                machineresult: datum,
                manualreview: null,
                illegal: datum.label == 1 ? true : false
            });
        });
        return new Promise(function(resolve, reject) {
            DBConn.insertData('fileinfo', infoData).then(res => {
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
        // console.log("queueData:",queueData);

        let res = await this.switchTaskStatus(queueData.data, 'locked');
        if(res.code == 500) {
            console.log('switch task status failed, try again later ...');
            setTimeout(() => this.atomProcess(), 2000);
            return {code: 500, msg: 'switch task status failed', status: 1};
        }
        // console.log("res:",res);

        let resData = await iHelp.censorBatch(queueData.data).catch(err => {console.log('inference err: ', err); return;});
        console.log('resData: ', resData);
        if(resData.code == 500) {
            console.log('call api failed, abort now ...');
            return;
        }
        
        res = await this.insertFileInfo(queueData.data, resData.data).catch(err => {console.log('insertFileInfo err: ', err); return;});
        if(res.code == 500) {
            console.log('insert fileinfo data failed, abort now ...');
            return {code: 500, msg: 'insert fileinfo data failed', status: 1};
        }
        console.log("insert fileinfo");
        
        res = await this.insertFileMeta(queueData.data).catch(err => {console.log('insertFileMeta err: ', err); return;});
        if(res.code == 500) {
            console.log('insert filemeta data failed, abort now ...');
            return {code: 500, msg: 'insert filemeta data failed', status: 1};
        }
        console.log("insert filemeta");

        res = await this.deleteTasks(queueData.data).catch(err => {console.log('deleteTasks err: ', err); return;});
        if(res.code == 500) {
            console.log('delete pooling data failed, abort now ...');
            return {code: 500, msg: 'delete pooling data failed', status: 1};
        }

        console.log(`|** deliverHelper.atomProcess **| INFO: ${queueData.data.length} data were handled ...`, new Date());
        return {
            code: 200,
            length: queueData.data.length,
            msg: `${queueData.data.length} data were handled ...`,
            status: 1
        };
    }

    processBatchImg() {
        setTimeout(function(){
            this.atomProcess(20).then(e => {
                console.log('processBatch: continue');
                if(e.status == 1) {
                    this.processBatchImg();
                } else {
                    console.log('processBatch: done');
                }
            });
        }.bind(this), 200);
    }

    processBatchVideo() {
        setTimeout(function(){
            this.videoProcess(1).then(e => {
                console.log('processBatch: continue');
                if(e.status == 1) {
                    this.processBatchVideo();
                } else {
                    console.log('processBatch: done');
                }
            });
        }.bind(this), 200);
    }

    async videoProcess(size=1) {
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

        let reqBody = JSON.stringify({
            "data": {
                "uri": task.data[0].filepath
            },
            "params": {
                "vframe": {
                    "mode": 0,
                    "interval": 5
                }
            },
            "ops": [
                {
                    "op": "wangan_mix"
                }
            ]
        });
        let resData = await iHelp.censorCall(config.CENSORVIDEOAPI, reqBody).catch(err => {console.log('inference err: ', err); return;});
        console.log('resData: ', resData);
        if(typeof(resData.wangan_mix) == 'undefined') {
            console.log('call api failed, abort now ...');
            return;
        }
        
        if(resData.wangan_mix.labels.filter(e=>e.label!='normal').length > 0) {
            resData.wangan_mix.label = 1;
        } else {
            resData.wangan_mix.label = 0;
        }

        let res = await this.insertFileInfo(task.data, [resData.wangan_mix]).catch(err => {console.log('insertFileInfo err: ', err); return;});
        if(res.code == 500) {
            console.log('insert fileinfo data failed, abort now ...');
            return {code: 500, msg: 'insert fileinfo data failed', status: 1};
        }
        console.log("insert fileinfo");
        
        res = await this.insertFileMeta(task.data).catch(err => {console.log('insertFileMeta err: ', err); return;});
        if(res.code == 500) {
            console.log('insert filemeta data failed, abort now ...');
            return {code: 500, msg: 'insert filemeta data failed', status: 1};
        }
        console.log("insert filemeta");

        res = await this.deleteTasks(task.data).catch(err => {console.log('deleteTasks err: ', err); return;});
        if(res.code == 500) {
            console.log('delete pooling data failed, abort now ...');
            return {code: 500, msg: 'delete pooling data failed', status: 1};
        }

        console.log(`|** deliverHelper.atomProcess **| INFO: ${task.data.length} data were handled ...`, new Date());
        return {
            code: 200,
            length: task.data.length,
            msg: `${task.data.length} data were handled ...`,
            status: 1
        };
    }
}

module.exports = deliverHelper;