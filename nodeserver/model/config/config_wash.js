let config = {};
switch(process.env.ENV) {
    case 'PRD':
        config = {
            MONGODB:        "mongodb://127.0.0.1:27017",
            DATABASE:       "fas",
            CENSORIMGAPI:   "http://127.0.0.1:10000/v1/wangan-mix",
            FILTERIMGAPI:   "http://15.15.15.72:35333/v1/pic",
            CENSORVIDEOAPI: "http://127.0.0.1:11000/v1/video/1",
            UPLOAD_PATH:    "./public/files",
            FILESERVER:     `http://15.15.15.72:${process.env.PORT}/files`,
        };
        break;
    case 'DEV':
        config = {
            MONGODB:        "mongodb://100.100.142.71:27018",
            DATABASE:       "fas",
            CENSORIMGAPI:   "http://localhost:10000/v1/wangan-mix",
            FILTERIMGAPI:   "http://localhost:23500/v1/pic",
            CENSORVIDEOAPI: "http://localhost:11000/v1/video/1",
            UPLOAD_PATH:    "./public/files",
            FILESERVER:     "http://100.100.140.18:3000/files",
        };
        break;
}

module.exports = {
    MONGODB:        config.MONGODB,
    DATABASE:       config.DATABASE,
    CENSORIMGAPI:   config.CENSORIMGAPI,
    FILTERIMGAPI:   config.FILTERIMGAPI,
    CENSORVIDEOAPI: config.CENSORVIDEOAPI,
    UPLOAD_PATH:    config.UPLOAD_PATH,
    FILESERVER:     config.FILESERVER,

    IMAGE_OPTIONS: {
        data: {
            uri: ""
        },
        params: {
            type: "internet_terror",
            detail: true
        }
    },

    VIDEO_OPTIONS: {
        data: {
            uri: ""
        },
        params:{
            vframe:{
                interval: 5
            }
        },
        ops:[{
            op:"wangan_mix",
            params:{
                other:{
                    type:"internet_terror"
                }
            }
        }]
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
            return data.result;
        } else {
            return null;
        }
    },

    videoResFormat: function(data) {
        let classes = [];
        let score = [];
        if(typeof(data.wangan_mix) == 'undefined') {
            return null;
        } else {
            data.wangan_mix.labels.map(item => {
                if(item.label != 'normal' && item.score > 0.75) {
                    classes.push(item.label);
                    score.push(item.label);
                }
            });
            
            return {
                label: classes.length == 0 ? 0:1,   // 0: normal; 1: illegal
                score: score,
                classes: classes,
                details: data.wangan_mix
            };
        }
    },

    CLASSIFY: {
        "pulp": "涉黄",
        "terror": "涉暴",
        "politician": "敏感人物"
    },

    DETECTION: {
        knives_true: "真刀",
        knives_false: "动漫刀",
        knives_kitchen: "厨房刀",
        guns_true: "真枪",
        guns_anime: "动漫枪",
        guns_tools: "玩具枪",
        BK_LOGO_1: "暴恐_ISIS_1号_台标",
        BK_LOGO_2: "暴恐_ISIS_2号_台标",
        BK_LOGO_3: "暴恐_ISIS_3号_台标",
        BK_LOGO_4: "暴恐_ISIS_4号_台标",
        BK_LOGO_5: "暴恐_ISIS_5号_台标",
        BK_LOGO_6: "暴恐_ISIS_6号_台标",
        falungong_logo: "法论功标志",
        isis_flag: "ISIS旗帜",
        islamic_flag: "伊斯兰教旗帜",
        tibetan_flag: "藏独旗帜",
        idcard_positive: "身份证正面",
        idcard_negative: "身份证背面",
        bankcard_positive: "银行卡正面",
        bankcard_negative: "银行卡背面",
        gongzhang: "公章",
        bloodiness_human: "血腥_人物血腥",
        bomb_fire: "爆炸_明火爆炸",
        bomb_smoke: "爆炸_烟雾爆炸",
        bomb_vehicle: "爆炸_汽车爆炸",
        'bomb_self-burning': "爆炸_人体自焚",
        beheaded_isis: "斩首_恐怖分子",
        beheaded_decollation: "斩首_残酷行刑",
        march_banner: "游行_抗议横幅",
        march_crowed: "游行_非法集会",
        fight_police: "斗殴_警民冲突",
        fight_person: "斗殴_打架斗殴",
        character: "敏感_字符文字",
        masked: "敏感_蒙面",
        army: "敏感_战争军队",
        scene_person: "敏感_人物",
        anime_likely_bloodiness: "敏感_血腥类_动漫",
        anime_likely_bomb: "敏感_爆炸类_动漫",
        islamic_dress: "敏感_着装",
    },
    SINAHOST:       "https://s.weibo.com"
}