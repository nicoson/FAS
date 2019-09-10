const fs		= require('fs');
const config    = require('./config');
const savepath  = config.UPLOAD_PATH;
const sconsole  = require('./sconsole');
const DBConn  = require('./DBConnection');
// const DBConn  = require('./DBConnection_bk');

// use UTC time zone
class storeHelper {
    constructor() {
        this.init();
    }

    init() {
        DBConn.createTable('taskpool', ['uid']).then(e => sconsole.log(e));
        DBConn.createTable('illegal', ['uid']).then(e => sconsole.log(e));
        DBConn.createTable('statistic').then(e => sconsole.log(e));
    }

    // get tasks in queue
    async storeProcess(file, type) {
        sconsole.log('|** storeHelper.storeProcess **| INFO: store file into disc and push to <TaskPool> queue table | ', new Date());
        let targetTable = 'taskpool';
        let timestamp = new Date();
        let filename = timestamp.getTime();
        let folder = `${type}/${this.getDateString(timestamp)}`;
       
        //  step 1: save file
        this.saveFile(file.data.uri, folder, filename);

        //  step 2: generate data bodylet timestamp = (new Date()).getTime();
        let data = {
            uid: filename,
            // name: file.meta.pic_name,
            type: type,
            uri: `${config.FILESERVER}/${folder}/${filename}`,
            info: {
                id: file.params.id
            },
            create: timestamp,
            update: timestamp
        }

        //  step 3: insert data to related table
        let res = await DBConn.insertData(targetTable, [data]).catch(err => sconsole.log(err));
        sconsole.log(`|** storeHelper.storeProcess **| INFO: data inserted to table <${targetTable}> | `, new Date());
        sconsole.log(res);
        return res;
    }

    saveFile(filedata, folder, name) {
        let base64Data = null;
        if(filedata.indexOf(';base64,') > -1) {
            base64Data = filedata.slice(filedata.indexOf(';base64,')+8);
        } else {
            base64Data = filedata;
        }
        let dataBuffer = new Buffer(base64Data, 'base64');
        let dirs = folder.split('/');
        let dir = savepath;
        dirs.map(d => {
            dir += `/${d}`;
            if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        });
        fs.writeFile(`${savepath}/${folder}/${name}`, dataBuffer, function(err) {
            if(err){
                sconsole.log("XXXXXXXXXXXXXXXXXXXXX  save file error ...");
                sconsole.log(err);
            }else{
                sconsole.log("=====================  save file success ...");
            }
        });
    }

    getDateString(day) {
        day = new Date(day);
        return `${day.getFullYear()}${(100+day.getMonth()+1).toString().slice(1)}${(100+day.getDate()).toString().slice(1)}`;
    }
}

module.exports = storeHelper;