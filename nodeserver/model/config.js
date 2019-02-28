module.exports = {
    // MONGODB:        "mongodb://100.100.62.149:37017",
    // DATABASE:       "qiniu-esp",
    MONGODB:        "mongodb://117.80.171.143:27017",
    DATABASE:       "wangan_yuqing",
    CENSORIMGAPI:   "http://100.100.62.134:10000/v1/wangan-mix",
    CENSORVIDEOAPI: "http://100.100.62.134:11000/v1/video/666",
    UPLOAD_PATH:    "./public/files",
    FILESERVER:     "http://100.100.62.149:3000/files/",
    QINIUAPI:       "http://api.qiniu.com",
    KMQ:            "WAYQ",
    CLASSIFY: {
        "bloodiness_human": "流血",
        "bomb_fire": "爆炸-火焰",
        "bomb_smoke": "爆炸-烟雾",
        "bomb_vehicle": "爆炸-汽车",
        "bomb_self-burning": "爆炸-自焚",
        "beheaded_isis": "isis 斩首",
        "beheaded_decollation": "砍头",
        "march_banner": "游行横幅",
        "march_crowed": "密集人群",
        "fight_police": "涉警",
        "fight_person": "斗殴",
        "character": "特殊文字",
        "masked": "面罩",
        "army": "军队",
        "scene_person": "敏感人物",
        "anime_likely_bloodiness": "动漫流血",
        "anime_likely_bomb": "动漫爆炸",
        "islamic_dress": "伊斯兰穿着"
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