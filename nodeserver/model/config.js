module.exports = {
    // MONGODB:        "mongodb://100.100.62.149:37017",
    // DATABASE:       "qiniu-esp",

    // MONGODB:        "mongodb://100.100.62.163:27017",
    // DATABASE:       "fas",
    // CENSORIMGAPI:   "http://100.100.62.163:10000/v3/censor/image",
    // CENSORVIDEOAPI: "http://100.100.62.163:11000/v3/censor/video",
    // UPLOAD_PATH:    "./public/files",
    // FILESERVER:     "http://100.100.62.163:3333/files",

    MONGODB:        "mongodb://127.0.0.1:27017",
    DATABASE:       "fas",
    CENSORIMGAPI:   "http://127.0.0.1:10000/v3/censor/image",
    CENSORVIDEOAPI: "http://127.0.0.1:11000/v3/censor/video",
    UPLOAD_PATH:    "./public/files",
    FILESERVER:     "http://127.0.0.1:3333/files",
    CLASSIFY: {
        "pulp": "涉黄",
        "terror": "涉暴",
        "politician": "敏感人物"
    },
    DETECTION: {
        "knives_true": "真刀",
        "knives_false": "假刀",
        "knives_kitchen": "厨房刀",
        "guns_true": "真枪",
        "guns_anime": "动漫枪",
        "guns_tools": "工具枪",
        "BK_LOGO_1": "暴恐图标1",
        "BK_LOGO_2": "暴恐图标2",
        "BK_LOGO_3": "暴恐图标3",
        "BK_LOGO_4": "暴恐图标4",
        "BK_LOGO_5": "暴恐图标5",
        "BK_LOGO_6": "暴恐图标6",
        "isis_flag": "isis旗帜",
        "islamic_flag": "伊斯兰旗帜",
        "tibetan_flag": "藏独旗帜",
        "idcard_positive": "身份证正面",
        "idcard_negative": "身份证背面",
        "bankcard_positive": "银行卡正面",
        "bankcard_negative": "银行卡背面",
        "gongzhang_logo": "公章",
        "falungong_logo": "法轮功图标"
    },
    SINAHOST:       "https://s.weibo.com"
}