// use UTC time zone
const sconsole = require('./sconsole');

class Concurrent {
    constructor(concurrency=10, core=null) {
        this.concurrency        = concurrency;
        this.concurrentCount    = 0;
        this.index  = 0;
        this.switch = false;    // 进程启动开关，该flag用于避免重复启动
        this.output = [];
        this.core   = core;
        this.worker = null;
    }

    init() {
        this.concurrentCount = 0;
        this.index  = 0;
        this.worker = this.watchJob();
    }

    run() {
        if(!this.switch) {
            this.init();
            this.switch = true;
            this.mainProcess();
        }
    }

    stop() {
        this.switch = false;
        clearInterval(this.worker.consume);
        clearInterval(this.worker.fetch);
        this.worker = null;
    }

    async mainProcess() {
        // sconsole.log('this.switch: ', this.switch);
        try {
            while(this.switch) {
                if(this.concurrentCount < this.concurrency) {
                    this.concurrentCount++;
                    sconsole.log(`=============>   call job, concurrent count now: ${this.concurrentCount}/${this.concurrency}`);
                    this.core.callJob(this.callBack.bind(this));
                } else {
                    sconsole.log(`... ... sleeeeeeeeeeeeeeeeeeping ... ...   ${this.concurrentCount}/${this.concurrency}`);
                    await new Promise(function(resolve, reject){
                        setTimeout(function(){resolve(1)}, 1000);
                    });
                }
            }
        }
        catch(err) {
            sconsole.log('err: ', err);
        }
        sconsole.log('process stopped successfully !');
    }

    callBack(res) {
        this.concurrentCount--;
        if(res != null) {
            this.output.push(res);
        }
        sconsole.log(`.................  call callback, concurrent count now: ${this.concurrentCount}`);
    }

    watchJob() {
        return {
            consume: setInterval(() => this.core.consume(this.output), 5000),
            fetch: setInterval(() => this.core.feedDataQueue(), 1000)
        }
    }

}

module.exports = Concurrent;