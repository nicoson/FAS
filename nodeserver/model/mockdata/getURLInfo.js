const request = require('request');
const qiniu = require("qiniu");

const accessKey = "ppca4hFBYQ_ykozmLUcSIJi8eLnYhFahE0OF5MoZ";
const secretKey = "kc6oDxKD3TYoRq3lUoS41-e4qtNYWzBSQZmigm7K";

class getURLInfo {
    constructor() {

    }

    genToken(reqURL) {
        let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        // let reqURL = "http://10.34.43.45:16301/admin/domain/oquqvdmso.bkt.clouddn.com";
        let contentType = 'application/json';
        let reqBody = '';
        // let token = qiniu.util.generateAccessTokenV2(mac, reqURL, 'GET', contentType, reqBody);
        let token = qiniu.util.generateAccessToken(mac, reqURL, reqBody);
        // console.log(token);
        return token;
    }

    getBucketInfo(reqURL) {
        let token = this.genToken(reqURL);
        let options = {
            method: 'GET',
            url: reqURL,//'http://10.34.43.45:16301/admin/domain/oquqvdmso.bkt.clouddn.com',
            headers: {
                // 'Content-Type': application/json,
                'Account': 'wangan@qiniu.com',
                'Authorization': token
            }
        };
        // console.log(options.headers.Authorization);
        return new Promise(function(resolve,reject){
            request(options, function (err, res, body) {
                if (err) {
                    console.log(err)
                    reject(err)
                }else {
                    // console.log(body);
                    resolve(JSON.parse(body));
                }
            });
        });
    }

    getIPInfo(bucket,key,uid) {
        let bucketKey = bucket + ':' + key;
        // "ava-test:atflow-log-proxy/images/terror-classify-2018-04-30T07-51-19-NSXjmunZFVlzLtnlC1XDTQ==";
        bucketKey = qiniu.util.urlsafeBase64Encode(bucketKey);
        let URI = "https://rs.qbox.me/aget/" + bucketKey + "/user/" + uid;
        // console.log(URI);
        let token = this.genToken(URI);
        let options = {
            method: 'POST',
            url: URI,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Account': 'wangan@qiniu.com',
                'Authorization': token
            }
        };

        return new Promise(function(resolve,reject){
            request(options, function (err, res, body) {
                if (err) {
                    // console.log(err)
                    reject(err)
                }else {
                    // console.log(body);
                    resolve(JSON.parse(body));
                }
            });
        });
    }
}

module.exports = getURLInfo;