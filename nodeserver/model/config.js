let config = null;

switch(process.env.SCENE) {
    case 'WASH':
        config = require('./config/config_wash');
        break;
    case 'GENERAL':
        config = require('./config/config_general');
        break;
}

module.exports = {
    MONGODB:        config.MONGODB,
    DATABASE:       config.DATABASE,
    CENSORIMGAPI:   config.CENSORIMGAPI,
    CENSORVIDEOAPI: config.CENSORVIDEOAPI,
    UPLOAD_PATH:    config.UPLOAD_PATH,
    FILESERVER:     config.FILESERVER,

    IMAGE_OPTIONS:  config.IMAGE_OPTIONS,
    VIDEO_OPTIONS:  config.VIDEO_OPTIONS,

    CLASSIFY:       config.CLASSIFY,
    DETECTION:      config.DETECTION,
    SINAHOST:       config.SINAHOST,

    judgeIllegalImage: config.judgeIllegalImage,
    judgeIllegalVideo: config.judgeIllegalVideo,
    imageResFormat: config.imageResFormat,
    videoResFormat: config.videoResFormat,
}