var crypto = require('crypto');
var fs = require('fs');

function md5(){};

md5.gen = function(filedir) {
    var buffer = fs.readFileSync(filedir);
    var fsHash = crypto.createHash('md5');
    
    fsHash.update(buffer);
    var md5val = fsHash.digest('hex');
    // console.log("文件的MD5是：%s", md5val);
    return md5val;
}

module.exports = md5;