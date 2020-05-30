let config = {};
switch(process.env.ENV) {
    case 'PRD':
        config = {
            MONGODB:        "mongodb://127.0.0.1:27017",
            DATABASE:       "fas",
            CENSORIMGAPI:   "http://127.0.0.1:10000/v3/censor/image",
            CENSORVIDEOAPI: "http://127.0.0.1:11000/v3/censor/video",
            UPLOAD_PATH:    "./public/files",
            FILESERVER:     `http://127.0.0.1:${process.env.PORT}/files`,
        };
        break;
    case 'DEV':
        config = {
            MONGODB:        "mongodb://100.100.142.113:27017",
            DATABASE:       "fas",
            CENSORIMGAPI:   "http://100.100.142.113:10000/v1/image/censor",
            CENSORVIDEOAPI: "http://100.100.142.113:11000/v3/censor/video",
            UPLOAD_PATH:    "./public/files",
            FILESERVER:     "http://100.100.141.137:3000/files",
        };
        break;
}

module.exports = {
    MONGODB:        config.MONGODB,
    DATABASE:       config.DATABASE,
    CENSORIMGAPI:   config.CENSORIMGAPI,
    CENSORVIDEOAPI: config.CENSORVIDEOAPI,
    UPLOAD_PATH:    config.UPLOAD_PATH,
    FILESERVER:     config.FILESERVER,

    IMAGE_OPTIONS: {
        data: {
            uri: ""
        },
        params: {
            type: ["pulp","terror","politician"],
            detail: true
        }
    },

    VIDEO_OPTIONS: {
        "data": {
            "uri": ""
        },
        "params": {
            "scenes": [
                "pulp",
                "terror",
                "politician"
            ],
            "cut_param": {
                "interval_msecs": 5000
            }
        }
    },

    judgeIllegalImage: function(datum) {
        // illegal: true;  normal: false
        // sconsole.log('XXXXX test XXXX:  ', Object.keys(datum).length, datum.label, datum)
        return (datum != null && Object.keys(datum).length > 0 && datum.label == 1);
    },

    judgeIllegalVideo: function(datum) {
        // illegal: true;  normal: false
        return (datum != null && Object.keys(datum).length > 0 && datum.label == 1);
    },

    imageResFormat: function(data) {
        if(data.code == 0) {
            let classes = [];
            // let score = [];
            data.result.details.map(datum => {
                let cls = v1_map(datum);
                if(cls.length != 0) {
                    classes.push(cls);
                    // score.push(datum.score);
                }
            });
            
            data.result.label = (classes.length == 0) ? 0:1;
            data.result.classes = classes;
            
            return data.result;
        } else {
            return null;
        }
    },

    videoResFormat: function(data) {
        if(data.code != 200) {
            return null;
        } else {
            let classes = [];
            if (data.result.scenes.politician.suggestion == 'block') classes.push('politician');
            if (data.result.scenes.pulp.suggestion == 'block') classes.push('pulp');
            if (data.result.scenes.terror.suggestion == 'block') classes.push('terror');
            
            return {
                label: classes.length == 0 ? 0:1,   // 0: normal; 1: illegal
                score: null,
                classes: classes,
                details: data.result
            };
        }
    },

    CLASSIFY: {
        "pulp": "涉黄",
        "terror": "涉暴",
        "politician": "敏感人物"
    },

    DETECTION: {
        guns: "真枪",
    },
    SINAHOST:       "https://s.weibo.com"
}

function v1_map(datum) {
    switch(datum.type) {
        case 'pulp':
            if(datum.label == 0) {
                return 'pulp';
            } else {
                return '';
            }
        case 'terror':
            if(datum.label == 1) {
                if(datum.class == 'guns') {    // filter only for guns
                    return 'terror';
                }
            } else {
                return '';
            }
        case 'politician':
            return '';  // filter politician
    }
}