const fetch = require('node-fetch');

class getIP {
    constructor() {

    }

    getZone(ip) {
        let url = `http://ip.taobao.com/service/getIpInfo.php?ip=${ip}`;
        return new Promise(function(resolve, reject){
            fetch(url).then(e => e.json()).then(res => {
                // console.log(res);
                resolve(res);
            }).catch(err => {
                console.log('getZone err: ', err);
                resolve(err)});
        });
    }
}

module.exports = getIP;