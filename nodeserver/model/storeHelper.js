const DBConn    = require('./DBConnection');
const md5       = require('./md5');
const config    = require('./config');

// use UTC time zone
class storeHelper {
    constructor() {
        this.init();
    }

    init() {
        // DBConn.createTable('taskpool', 'md5').then(e => console.log(e));
        // DBConn.createTable('fileinfo', 'md5').then(e => console.log(e));
        // DBConn.createTable('filemeta', 'uid').then(e => console.log(e));
    }

    // get tasks in queue
    async storeProcess(file, metaData = {}) {
        console.log('|** storeHelper.storeProcess **| INFO: store file into disc and push to <TaskPool> queue table | ', new Date());
        let targetTable = null;
       
        //  step 1: calculate md5 value
        let md5value = md5.gen(file.path);
        // console.log(md5value);

        //  step 2: generate data body
        let timestamp = (new Date()).getTime();
        let data = {
            uid: file.filename,
            md5: md5value,
            meta: metaData,
            // filepath: 'https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=3680604140,401532791&fm=179&app=42&f=JPEG?w=121&h=140',
            filepath: config.FILESERVER + file.filename,
            create: timestamp,
            update: timestamp
        }

        //  step 2: check the police md5 database
        let md5res = await DBConn.queryData('md5', {md5: md5value}, 1).catch(err => console.log(err));

        //  step 3: check the censor table
        if(md5res.length > 0) {
            // console.log(md5res);
            targetTable = 'filemeta';
            data.type = 'md5';
        } else {
            let infoRes = await DBConn.queryData('fileinfo', {md5: md5value}, 1).catch(err => console.log(err));
            if(infoRes.length > 0) {
                if(infoRes[0].manualreview == false || (infoRes[0].manualreview == null && infoRes[0].illegal == false)) {
                    return 'abandoned'; // 无害信息，无需再审，无需记录
                }
                targetTable = 'filemeta';
                data.type = 'censor';
            } else {
                let poolRes = await DBConn.queryData('taskpool', {md5: md5value}, 1).catch(err => console.log(err));
                if(poolRes.length > 0) {
                    console.log('=====> warning: task already exists !');
                    return 'abandoned'; //  已存在队列，无需再进pool，注：此处会有信息丢失
                } 
                targetTable = 'taskpool';
                data.status = null;
            }
        }
        // console.log(data);

        //  step 4: insert data to related table
        let res = await DBConn.insertData(targetTable, [data]).catch(err => console.log(err));
        console.log(`|** storeHelper.storeProcess **| INFO: data inserted to table <${targetTable}> | `, new Date());
        // console.log(res);
        return res;
    }

}

module.exports = storeHelper;