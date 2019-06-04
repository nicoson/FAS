const fs		= require('fs');
const DBConnection    = require('./DBConnection');
const config    = require('./config');
const savepath  = config.UPLOAD_PATH;

let DBConn = new DBConnection();

// use UTC time zone
class storeHelper {
    constructor() {
        this.init();
    }

    init() {
        DBConn.createTable('taskpool', ['uid']).then(e => console.log(e));
        DBConn.createTable('illegal', ['uid']).then(e => console.log(e));
        DBConn.createTable('statistic').then(e => console.log(e));
    }

    // get tasks in queue
    async storeProcess(file, type) {
        console.log('|** storeHelper.storeProcess **| INFO: store file into disc and push to <TaskPool> queue table | ', new Date());
        let targetTable = 'taskpool';
        let timestamp = new Date();
        let filename = timestamp.getTime();
       
        //  step 1: save file
        this.saveFile(file.data.uri, filename);

        //  step 2: generate data bodylet timestamp = (new Date()).getTime();
        let data = {
            uid: filename,
            // name: file.meta.pic_name,
            type: type,
            uri: `${config.FILESERVER}/${filename}`,
            info: {
                id: file.params.id
            },
            create: timestamp,
            update: timestamp
        }

        //  step 3: insert data to related table
        let res = await DBConn.insertData(targetTable, [data]).catch(err => console.log(err));
        console.log(`|** storeHelper.storeProcess **| INFO: data inserted to table <${targetTable}> | `, new Date());
        console.log(res);
        return res;
    }

    saveFile(filedata, name) {
        var base64Data = filedata.slice(filedata.indexOf(';base64,')+8);
        var dataBuffer = new Buffer(base64Data, 'base64');
        fs.writeFile(`${savepath}/${name}`, dataBuffer, function(err) {
            if(err){
                console.log("XXXXXXXXXXXXXXXXXXXXX  save file error ...");
            }else{
                console.log("=====================  save file success ...");
            }
        });
    }
}

module.exports = storeHelper;