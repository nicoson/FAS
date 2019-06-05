// use UTC time zone
class Concurrent {
    constructor(concurrency=10, core=null) {
        this.concurrency = concurrency;
        this.concurrentCount = 0;
        this.index = 0;
        this.switch = false;
        this.output = [];
        this.core = core;
    }

    init() {
        this.concurrentCount = 0;
        this.index = 0;
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
    }

    async mainProcess() {
        // console.log('this.switch: ', this.switch);
        try {
            while(this.switch) {
                if(this.concurrentCount < this.concurrency) {
                    this.concurrentCount++;
                    console.log(`=============>   call job, concurrent count now: ${this.concurrentCount}/${this.concurrency}`);
                    this.core.callJob(this.callBack.bind(this));
                } else {
                    console.log('... ... sleeeeeeeeeeeeeeeeeeping ... ...');
                    await new Promise(function(resolve, reject){
                        setTimeout(function(){resolve(1)}, 200);
                    });
                }
            }
        }
        catch(err) {
            console.log('err: ', err);
        }
        console.log('process stopped successfully !');
    }

    callBack(res) {
        this.concurrentCount--;
        this.output.push(res);
        console.log(`.................  call callback, concurrent count now: ${this.concurrentCount}`);

        this.core.consume(this.output);
    }

}

module.exports = Concurrent;