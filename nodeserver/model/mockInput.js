const fusionDBConn  = require('./fusionDBConn');
// const ObjectId      = require('mongodb').ObjectId
const DBConn  = require('./DBConnection');
// const DBConn  = require('./DBConnection_bk');

class mockHelper {
    constructor() {
        this.step = 1000;
    }

    async getData(size=100, id=null, type='image') {
        console.log("id: ",id);
        console.log('|** mockHelper.getData **| INFO: get data from <url> table for detail view| ', new Date());
        
        let conditions = null;
        switch(type) {
            case 'image':
                conditions = {$and: [{url: /\.png|\.jpeg|\.jpg|\.bmp/}]};
                break;
            case 'video':
                conditions = {$and: [{url: /\.rm|\.mp4|\.avi|\.wmv|\.3gp/}]};
                break;
            default:
                break;
        }
        if(id != null) {
            conditions['$and'].push({_id: {$gt: id}});
        }
        console.log('conditions: ', conditions);
        let res = await fusionDBConn.queryData('url', conditions, size, 0).catch(err => {console.log(err); return []});
        return res;
    }

    async insertData(data, type=null) {
        console.log(`|** mockHelper.insertData **| INFO: data inserted to table <taskpool> | `, new Date());
        let timestamp = (new Date()).getTime();
        let inputs = []
        data.map(datum => {
            inputs.push({
                uid: datum.url,
                md5: datum.url,
                meta: {
                    ip: '192.168.1.1',
                    port: 2828
                },
                filepath: datum.url,
                filetype: type,
                create: timestamp,
                update: timestamp
            });
        })
        let res = await DBConn.insertData('taskpool', inputs).catch(err => console.log(err));
        return res;
    }

    copyImgData(count=0, id=null) {
        this.getData(this.step, id, 'image').then(data => {
            let flag = true;
            if(data.length < this.step) {
                flag = false;
            }
            let id = data[data.length-1]._id;
            this.insertData(data, 'image').then(res => {
                if(flag) {
                    count++;
                    console.log(`this is the ${count} round ...`);
                    this.copyImgData(count, id);
                }
            });
        });
    }

    copyVideoData(count=0, id=null) {
        this.getData(this.step, id, 'video').then(data => {
            let flag = true;
            if(data.length < this.step) {
                flag = false;
            }
            let id = data[data.length-1]._id;
            this.insertData(data, 'video').then(res => {
                if(flag) {
                    count++;
                    console.log(`this is the ${count} round ...`);
                    this.copyVideoData(count, id);
                }
            });
        });
    }
}

module.exports = mockHelper;