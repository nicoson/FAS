const fetch = require('node-fetch');
const config = require('./config');
const qiniu = require("qiniu");

class kmqHelper {
    constructor() {
    }

    genToken(reqURL, reqBody = '', method='GET', type='qbox', isAdmin=false) {
        const accessKey = isAdmin?"ppca4hFBYQ_ykozmLUcSIJi8eLnYhFahE0OF5MoZ":"CP1wPpP9TDtBrRYgeOoONlDm7iF8fjOKKr5RsOsA";   // avatest account
        const secretKey = isAdmin?"kc6oDxKD3TYoRq3lUoS41-e4qtNYWzBSQZmigm7K":"apc7jIWXgk3yiqSAcCg_93XUNK0BjVrviVEqZLNA";

        let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        let contentType = 'application/json';
        let token = null;
        if(type == 'qiniu') {
            token = qiniu.util.generateAccessTokenV2(mac, reqURL, 'POST', contentType, reqBody);
        } else {
            token = qiniu.util.generateAccessToken(mac, reqURL, reqBody);
        }
        // console.log(token);
        return token;
    }

    createMQ(uid=1381102889, name, expireDays) {
        let api = config.QINIUAPI + '/queues';
        let postBody = JSON.stringify({
            "uid": uid,
            "name": name,
            "retention": expireDays
        });
        let token = this.genToken(api, postBody, 'POST', 'qiniu', true);
        let options = {method: "POST", headers: {"Content-Type": "application/json"}};
        options.headers.Authorization = token;
        options.body = postBody;

        // console.log(api);
        // console.log(options);

        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                console.log(e);
                resolve(e);
            });
        });
    }

    deleteMQ(uid=1381102889, name) {
        let api = config.QINIUAPI + '/queues/delete';
        let postBody = JSON.stringify({
            "uid": uid,
            "name": name
        });
        let token = this.genToken(api, postBody, 'POST', 'qiniu', true);
        let options = {method: "POST", headers: {"Content-Type": "application/json"}};
        options.headers.Authorization = token;
        options.body = postBody;

        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                console.log(e);
                resolve(e);
            });
        });
    }

    updateMQ(uid=1381102889, name, expireDays) {
        let api = `${config.QINIUAPI}/queues/${name}`;
        let postBody = JSON.stringify({
            "uid": uid,
            "retention": expireDays
        });
        let token = this.genToken(api, postBody, 'POST', 'qiniu', true);
        let options = {method: "POST", headers: {"Content-Type": "application/json"}};
        options.headers.Authorization = token;
        options.body = postBody;

        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                console.log(e);
                resolve(e);
            });
        });
    }

    queryMQ(uid, name) {
        let api = `${config.QINIUAPI}/queues/${name}?uid=${uid}`;
        let token = this.genToken(api,'','GET','qbox', true);
        let options = {method: 'GET', headers: {}};
        options.headers.Authorization = token;

        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                console.log(e);
                resolve(e);
            });
        });
    }

    insertMQ(name, data) {
        let api = `${config.QINIUAPI}/queues/${name}/produce`;
        let postBody = JSON.stringify({
            "msgs": data
        });
        let token = this.genToken(api, postBody, 'POST', 'qiniu', false);
        let options = {method: 'POST', headers: {"Content-Type": "application/json"}};
        options.headers.Authorization = token;
        options.body = postBody;

        // console.log(api);
        // console.log(options);
        // console.log(postBody);
        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                // console.log(e);
                resolve(e);
            });
        });
    }

    consumeMQ(name, limit=2) {
        let api = `${config.QINIUAPI}/queues/${name}/consume?limit=${limit}`;
        let token = this.genToken(api,'', 'GET', 'qbox', false);
        let options = {method: 'GET', headers: {}};
        options.headers.Authorization = token;

        // console.log(api);
        // console.log(options);
        return new Promise(function(resolve, reject) {
            fetch(api, options).then(e => {
                console.log(e);
                resolve(e);
            });
        });
    }
}

module.exports = kmqHelper;
