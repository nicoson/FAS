const qiniu = require("qiniu");
const accessKey = "Sj2l3BjGqs47X7fxS_JtrBIsyn2StiV1RI8dppqR";   // avatest account
const secretKey = "DXVZR5iqJlHw7EiWTYrsAgmcV4pVrN8Tb0vfO_Lg";

class genToken {
    constructor() {

    }

    genToken(reqURL, reqBody='', isMock=false) {
        if(isMock) return 'QiniuStub uid=1&ut=2';

        let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        let contentType = 'application/json';
        let token = qiniu.util.generateAccessTokenV2(mac, reqURL, 'POST', contentType, reqBody);
        return token;
    }

}

module.exports = genToken;