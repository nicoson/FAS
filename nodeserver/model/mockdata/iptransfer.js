const getURLInfo    = require('./getURLInfo');
const GETIP         = require('./getip');
const DBConn        = require('../DBConnection');
const ParseIP       = require('./ParseIP');
const URL           = require('url');

let gb = new getURLInfo();
let getip = new GETIP();

class ipTransfer {
    constructor() {}

    convert(table) {
        DBConn.getUnhandledData(table).then(data => {
            this.loopBody(data, table);
        }).catch(err=>console.log(err));
    }
    
    loopBody() {
        this.mainProcess().then(res => {
            if(res != 'done') {
                setTimeout(function(){this.loopBody();}.bind(this), 500);
            }
        });
    }

    async getMetaData() {
        let conditions = {
            'meta.port': 2828
        }
        let res = await DBConn.queryData('filemeta', conditions, 50, 0).catch(err => {console.log(err); return []});
        return res;
    }

    async updateMetaData(metaData) {
        let timestamp = (new Date()).getTime();
        let operations = metaData.map(datum => {return {
            updateOne: {
                filter: {uid: datum.uid},
                update: {$set: {
                    meta: datum.meta,
                    update: timestamp
                }}
            }
        };});
        return new Promise(function(resolve, reject) {
            DBConn.updateData('filemeta', operations).then(data => {
                console.log(data)
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

    async getInfo(url) {
        let urlinfo = URL.parse(url);
        let domain = urlinfo.host;
        let key = urlinfo.pathname.slice(1);
        let reqURL = "http://10.34.43.45:16301/admin/domain/" + domain;

        let bucketInfo = await gb.getBucketInfo(reqURL);
        console.log(bucketInfo);
        if(typeof(bucketInfo.uid) == 'undefined') {
            return 'UNKNOWN';
        } else {
            let fileInfo = await gb.getIPInfo(bucketInfo.source.sourceQiniuBucket, key, bucketInfo.uid);
            console.log(fileInfo);
            if(typeof(fileInfo.ip) == 'undefined') {
                return 'UNKNOWN';
            } else {
                let ip = ParseIP.ParseIP(fileInfo.ip.slice(0,-2)+'==');
                console.log(ip);
                let res = await getip.getZone(ip);
                // console.log(res);
                if(res.code == 0) {
                    return res.data;
                } else {
                    return {
                        ip: ip,
                        geoinfo: 'UNKNOWN'
                    };
                }
            }
        }
    }

    async mainProcess() {
        let rawdata = await this.getMetaData();
        if(rawdata.length == 0) {
            return new Promise(function(resolve, reject) {resolve('done')});
        }
    
        return new Promise(function(resolve, reject) {
            let p = [];
            for(let i in rawdata) {
                p.push(this.getInfo(rawdata[i].filepath));
            }
    
            Promise.all(p).then(res => {
                rawdata.map((datum,ind) => {
                    datum.meta = res[ind]
                });
                console.log(rawdata);
                this.updateMetaData(rawdata).then(e => resolve(e));
            }).catch(err => {
                console.log('mainProcess err: ', err);
                reject(err);
            });
        }.bind(this));
    }
}

module.exports = ipTransfer;