const fetch = require('node-fetch');
const cheerio = require('cheerio');
const DBConn = require('../DBConnection');
const kmqHelper = require('../kmqHelper');
const CONFIG = require('../config');

let kmq = new kmqHelper();

class spider {
    constructor() {
        this.init();
    }

    init() {
        // DBConn.createTable('rawdata', ['mid']);
        // DBConn.createTable('resource', ['uri']);
        // DBConn.createTable('relationdata', ['mid','key','city']);
        this.spiderJob = {};
        this.period = 8*60;  // as weibo search only show 50 pages, which can only cover 10 mins
        DBConn.queryData('weibojobmgr', {}, 1000, 0).then(data => {
            if(data.length > 0) {
                this.spiderJob = data[0];
                delete this.spiderJob['_id'];
                for(let jobid in data[0]) {
                    this.jobExec(jobid);
                }
            }
        });
    }

    //  status: 1. "running"; 2. "pause".
    createSpiderJob(key, city) {
        let today = new Date();
        let jobid = today.getTime();
        this.spiderJob[jobid] = {
            key: key,
            city: city,
            status: 'running',          // 1. "running": user set running; 2. "pause": user set pause, while process may not stop yet
            create_date: today,
            currentStatus: 'running'    // 1. "running": process is running; 2. "pending": process stoped
        };
        this.refreshJobDb('weibojobmgr', this.spiderJob).then(e => {console.log('update job info')});
        this.jobExec(jobid);
        return jobid;
    }

    pauseSpiderJob(jobid) {
        console.info(`[INFO] |** spider.pauseSpiderJob <${new Date().toJSON()}> **| Job ${jobid} paused ...`);
        this.spiderJob[jobid].status = 'pause';
        this.refreshJobDb('weibojobmgr', this.spiderJob).then(e => {console.log('update job info')});
        return jobid;
    }

    startSpiderJob(jobid) {
        console.info(`[INFO] |** spider.startSpiderJob <${new Date().toJSON()}> **| Job ${jobid} restarted ...`);
        this.spiderJob[jobid].status = 'running';
        if(this.spiderJob[jobid].currentStatus != 'running') {
            this.jobExec(jobid);
        }
        this.refreshJobDb('weibojobmgr', this.spiderJob).then(e => {console.log('update job info')});
        return jobid;
    }

    destorySpiderJob(jobid) {
        console.info(`[INFO] |** spider.destorySpiderJob <${new Date().toJSON()}> **| Job ${jobid} destoried ...`);
        delete this.spiderJob[jobid];
        this.refreshJobDb('weibojobmgr', this.spiderJob).then(e => {console.log('update job info')});
        return jobid;
    }

    refreshJobDb(table, data) {
        data = JSON.parse(JSON.stringify(data));    // here use deep copy in case of mongo insert function will add '_id' into raw data
        return new Promise(function(resolve, reject) {
            DBConn.dropTable(table).then(() => {
                DBConn.insertData(table, [data]).then(res => {
                    console.info(`[INFO] |** spider.refreshJobDb <${new Date().toJSON()}> **| ${res} data has been updated into <${table}> !`);
                    resolve({code: 0, msg: res});
                }).catch(err => {
                    console.error(`[ERROR] |** spider.refreshJobDb <${new Date().toJSON()}> **| data update failed due to: ${err}`);
                    resolve({code: 500, msg: err});
                });
            });
        });
    }

    async jobExec(jobid) {
        if(typeof(this.spiderJob[jobid]) != 'undefined' && this.spiderJob[jobid].status == "running") {
            this.spiderJob[jobid].currentStatus = 'running';
            let now = new Date();
            let year = now.getFullYear(),
                month = now.getMonth() + 1,
                day = now.getDate(),
                hour = now.getHours();
            await this.spider(this.spiderJob[jobid].key, 
                this.spiderJob[jobid].city, 
                `${year}-${(month+100).toString().slice(1,3)}-${(day+100).toString().slice(1,3)}-${hour}`, 
                `${year}-${(month+100).toString().slice(1,3)}-${(day+100).toString().slice(1,3)}-${hour+1}`
            );
            this.spiderJob[jobid].currentStatus = 'pending';
            await this.interval(this.period);
            this.jobExec(jobid);
        } else {
            console.log(`job closed ...`);
        }
        return;
    }

    getJobs() {
        return this.spiderJob;
    }

    async spider(key='上海', city='31:1000', starttime='2019-01-29-0', endtime='2019-01-29-1') {
        let pages = await this.readSinaQueryPageList(key, city, starttime, endtime);
        
        //  in case of IP forbidden, use sync way to get data
        for(let i in pages) {
            let res = await this.readSinaPage(pages[i], starttime.split('-').slice(0,3));
            await this.saveData('rawdata', res);
            await this.saveData('relationdata', res.map(item => {return {mid: item.mid, key: key, city: city}}));
            
            let resource = [];
            res.map(item => {
                //  source: 1: qiniu; 2: weibo; 3: douyin
                //  type: 1: image; 2: video; 3: audio
                resource.push(...item.self_img.map(i => {return JSON.stringify({uri: i, type: 1, source: 2})}));
                resource.push(...item.self_video.map(i => {return JSON.stringify({uri: i, type: 2, source: 2})}));
                resource.push(...item.forward_img.map(i => {return JSON.stringify({uri: i, type: 1, source: 2})}));
                resource.push(...item.forward_video.map(i => {return JSON.stringify({uri: i, type: 2, source: 2})}));
            });
            await kmq.insertMQ(CONFIG.KMQ, resource);

            await this.interval(1);
            console.log(`=====> saving ${parseInt(i)+1}th page, sleep 1 second`);
        }

        // saveRes = this.saveData('resource', data);
        // if(saveRes.code == 500) return saveRes;

        return {
            code: 0,
            msg: 'perfect'
        };
    }

    async readSinaQueryPageList(key='上海', city='31:1000', starttime='2019-01-29-0', endtime='2019-01-29-1') {
        let url = `${CONFIG.SINAHOST}/weibo?q=${encodeURIComponent(key)}&typeall=1&suball=1${(city==null?'':('&region=custom:'+city))}&timescope=custom:${starttime}:${endtime}&Refer=g`;
        let html = await fetch(url).then(e => e.text());
        let $ = cheerio.load(html);
        let ele = $('ul[node-type="feed_list_page_morelist"] a');
        let pages = [];
        if(ele.length == 0) {
            pages.push(url);
        } else {
            for(let i=0; i<ele.length; i++) {
                pages.push(CONFIG.SINAHOST + ele.eq(i).attr('href'));
            }
        }
        console.log('pages: ', pages);
        
        return pages;
    }

    async readSinaPage(url, date=[2019,0,1]) {
        let res = [];
        try {
            let html = await fetch(url).then(e => e.text());
            let $ = cheerio.load(html);
            if($('.card-no-result').length == 0 ) {
                let card = $('.card-feed');
                for(let i=0; i<card.length; i++) {
                    //  step 1: get sina mid
                    let mid = card.eq(i).parent().parent().attr('mid');
        
                    //  step 2: get user nick name
                    let nickname = card.eq(i).find('div.info a.name').attr('nick-name');

                    //  step 3: get user's weibo page
                    let uri = 'http:' + card.eq(i).find('div.info a.name').attr('href');
        
                    //  step 4: get main content text
                    let self_content = '';
                    if(card.eq(i).find('.content>p[node-type="feed_list_content_full"]').length == 0) {
                        self_content = card.eq(i).find('.content>p[node-type="feed_list_content"]').text();
                    } else {
                        self_content = card.eq(i).find('.content>p[node-type="feed_list_content_full"]').text();
                    }
        
                    //  step 5: get image list
                    let images = card.eq(i).find('div[node-type="fl_pic_list"] li img');
                    let self_img = [];
                    for(let j=0; j<images.length; j++) {
                        self_img.push('http:' + images.eq(j).attr('src').replace('/thumb150/','/bmiddle/'));
                    }
        
                    //  step 6: get video
                    let video = card.eq(i).find('div.content>div.media a[node-type="fl_h5_video"]');
                    let self_video = [];
                    if(video.length > 0) {
                        let info = video.eq(0).attr('action-data').split('&');
                        self_video.push('http:' + decodeURIComponent(info.slice(-1)[0].replace('video_src=','')));
                    }
                    
                    //  step 7: get forward user's nick name
                    let forward_nickname = card.eq(i).find('div.card-comment a.name').attr('nick-name');
        
                    //  step 8: get forward user's content text
                    let forward_content = '';
                    if(card.eq(i).find('div.card-comment p[node-type="feed_list_content_full"]').length == 0) {
                        forward_content = card.eq(i).find('div.card-comment p[node-type="feed_list_content"]').text();
                    } else {
                        forward_content = card.eq(i).find('div.card-comment p[node-type="feed_list_content_full"]').text();
                    }
                    
                    //  step 9: get forward user's image list
                    images = card.eq(i).find('div.card-comment div[node-type="fl_pic_list"] li img');
                    let forward_img = [];
                    for(let j=0; j<images.length; j++) {
                        forward_img.push('http:' + images.eq(j).attr('src').replace('/thumb150/','/bmiddle/'));
                    }
        
                    //  step 10: get forward user's video
                    let forward_video = [];
                    if(card.eq(i).find('div.card-comment a[node-type="fl_h5_video"]').length > 0) {
                        let info = card.eq(i).find('div.card-comment a[node-type="fl_h5_video"]').eq(0).attr('action-data').split('&');
                        forward_video.push('http:' + decodeURIComponent(info.slice(-1)[0].replace('video_src=','')))
                    }
        
                    //  step 11: get publish date
                    let self_date = card.eq(i).find('.content>.from').text();
                    if(/\d\d:\d\d/g.exec(self_date) == null) {
                        self_date = null;
                    } else {
                        self_date = new Date(...date, .../\d\d:\d\d/g.exec(self_date)[0].split(':'), 0);
                    }
                    // self_date = [...date, .../\d\d:\d\d/g.exec(self_date)[0].split(':'), 0];
        
                    //  step 12: get publish date
                    let time = card.eq(i).find('.card-comment .from').text();
                    let hour = /\d\d:\d\d/g.exec(time);
                    let forward_date = null;
                    if(hour != null) {
                        hour = hour[0].split(':');
                        let year = /\d\d\d\d年/g.exec(time);
                        if(year == null) {
                            year = new Date().getFullYear();
                        } else {
                            year = parseInt(year[0].replace('年',''));
                        }
                        let month = /\d\d月/g.exec(time);
                        if(month == null) {
                            month = new Date().getMonth();
                        } else {
                            month = parseInt(month[0].replace('月',''))-1;
                        }
                        
                        let day = /\d\d日/g.exec(time);
                        if(day == null) {
                            day = new Date().getDate();
                        } else {
                            day = parseInt(day[0].replace('日',''));
                        }
                        forward_date = new Date(year,month,day,...hour,0);
                        // forward_date = [year,month,day,...hour,0];
                    }
                    
                    //  summary output
                    res.push({
                        mid: mid,
                        nickname: nickname,
                        uri: uri,
                        self_content: self_content,
                        self_img: self_img,
                        self_video: self_video,
                        self_date: self_date,
                        forward_nickname: forward_nickname,
                        forward_content: forward_content,
                        forward_img: forward_img,
                        forward_video: forward_video,
                        forward_date: forward_date,
                        create_date: new Date()
                    });
                }
            }
        }
        catch(err) {
            console.log(`[ERROR] |** spider.readSinaPage <${new Date().toJSON()}> **|  err msg: `, err);
        }
        

        return res;
    }

    saveData(table, data) {
        return new Promise(function(resolve, reject) {
            DBConn.insertData(table, data).then(res => {
                console.info(`[INFO] |** spider.saveData <${new Date().toJSON()}> **| ${res} data has been inserted into <${table}> !`);
                resolve({code: 0, msg: res});
            }).catch(err => {
                console.error(`[ERROR] |** spider.saveData <${new Date().toJSON()}> **| data insert failed due to: ${err}`);
                resolve({code: 500, msg: err});
            });
        });
    }

    interval(seconds) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(0);
            }, seconds*1000);
        });
    }

    async queryData(key, city) {
        let num = await DBConn.count('relationdata', {key:key,city:city});
        return num;
    }
}

module.exports = spider;