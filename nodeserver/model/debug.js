const CONCURRENT    = require('./concurrent');
const config        = require('./config');
const deliverHelper = require('../model/deliverHelper');
const InferenceHelper = require('./Inference');

let dh      = new deliverHelper();
let iHelp   = new InferenceHelper(false);

class job {
    constructor(preload=100) {
        this.preload = preload;
        this.data = [];
        this.fetching = false;
    }

    async getImg() {
        //  如果已经有其他 job 在请求数据了，那么等待
        while(this.fetching) {
            console.log('  ... waiting for fetching ...');
            await this.sleep(1000);
        }
        if(this.data.length < 1) {
            this.fetching = true;
            while(this.fetching) {
                this.data = (await dh.queryTasks(this.preload,'image')).data;
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

    async callJob(callBack) {
        let datum = await this.getImg();
        let reqBody = JSON.stringify({
            "data": {
                "uri": datum.uri
            },
            "params": {
                "detail": true,
                "type": "internet_terror"
            }
        });
        let res = await iHelp.censorCall(config.CENSORIMGAPI, reqBody).catch(err => console.log('err: ', err));
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
        if(data.length > 100) {
            let temp = data.splice(0,100);
            let rawData = temp.map(datum => datum.source);
            let resData = temp.map(datum => datum.res);

            //  step 1: insert data
            let res = await dh.insertIllegal(rawData, resData).catch(err => {console.log('insertIllegal err: ', err); return;});
            if(res.code == 500) {
                console.log('insert insertIllegal data failed, abort now ...');
                return {code: 500, msg: 'insert insertIllegal data failed', status: 1};
            }
            console.log("============>  insert fileinfo");

            //  step 2: delete task
            res = await dh.deleteTasks(rawData).catch(err => {console.log('deleteTasks err: ', err); return;});
            if(res.code == 500) {
                console.log('delete pooling data failed, abort now ...');
                return {code: 500, msg: 'delete pooling data failed', status: 1};
            }

            //  step 3: delete file
            res = await dh.deleteFiles(rawData, resData).catch(err => {console.log('deleteFiles err: ', err); return;});
            if(res.code == 500) {
                console.log('delete file failed, abort now ...');
                return {code: 500, msg: 'delete file failed', status: 1};
            }

            console.log(`|** deliverHelper.atomProcess **| INFO: ${rawData.length} data were handled ...`, new Date());
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


let concurrent = new CONCURRENT(10, job);
concurrent.run();