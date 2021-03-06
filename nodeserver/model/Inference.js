const fetch = require('node-fetch');
const config = require('./config');
const genToken  = require('./genToken');

let gt = new genToken();

class InferenceHelper {
    constructor(isMock = false) {
        this.options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        this.isMock = isMock;
    }

    /* ========================= *\
          handle domain table
    \* ========================= */
    censorCall(api, reqBody) {
        //  for mock test
        if(this.isMock) {
            console.log('#################################');
            console.log('====  This is Mock test data ====');
            console.log('#################################');
            return new Promise(function(resolve, reject) {
                resolve({
                    "code":0,
                    "message":"",
                    "result":{
                        "classify":{
                            "confidences":[{
                                "class":"normal",
                                "index":47,
                                "score":0.9989687204360962
                            }]
                        },
                        "detection":[{
                            "class":"guns_true",
                            "index":4,
                            "pts":[[2,96],[500,96],[500,419],[2,419]],
                            "score":0.8570542335510254
                        }]
                    }
                });
            });
        }

        this.options.body = reqBody;
        let token = gt.genToken(api, this.options.body, false);
        this.options.headers.Authorization = token;

        return new Promise(function(resolve, reject){
            // if(url.search(/.png|.jpg|.jpeg|.webp|.bmp|.gif/i) < 0) {
            //     console.log('xxxxxxxxxxxxx> url:', url);
            //     resolve({
            //         code: 204,
            //         data: -1
            //     });
            //     return;
            // }
            console.log('============> get: ', reqBody);
            fetch(api, this.options).then(e => e.json()).then(data => {
                if(data.error == undefined) {
                    resolve(data);
                } else {
                    resolve({
                        code: 500,
                        err: data.error,
                        result: {}
                    });
                }
            }).catch(err => resolve({
                code: 500,
                err: err,
                result: {}
            }));
        }.bind(this));
    }

    censorBatch(data) {
        try {
            return new Promise(function(resolve, reject) {
                let p = [];
                let respond = [];
                for(let datum of data) {
                    let reqBody = JSON.stringify({
                        "data": {
                            "uri": datum.filepath
                        },
                        "params": {
                            "type": [
                                "pulp",
                                "terror",
                                "politician"
                            ],
                            "detail": true
                        }
                    });
                    p.push(this.censorCall(config.CENSORIMGAPI, reqBody));
                }

                Promise.all(p).then(res => {
                    console.log('censor Batch: ',res);
                    for(let i in res) {
                        if(res[i].code == 0) {
                            let result = this.resHandler(res[i]);
                            respond.push(result);
                        } else {
                            respond.push({
                                "classify": {
                                    "confidences": [{"class": "normal", "index": 1, "score": 1}]
                                }, 
                                "detection": [],
                                "label": 0
                            });
                        }
                    }

                    resolve({
                        code: 200,
                        data: respond
                    });
                }).catch(err => reject({code: 500, err: err}));
            }.bind(this));
        }
        catch(err) {
            console.log(err);
            return this.censorBatch(size);
        }
    }

    resHandler(data) {
        //  set default as legal
        console.log('data: ', data);
        data.result.label = 0;
        if (data.code == 0 && (data.result.classify.confidences[0].class != 'normal' || data.result.detection.length > 0)) {
            data.result.label = 1;
        }
        return data.result;
    }
}

module.exports = InferenceHelper;
