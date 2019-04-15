const DBConn    = require('./DBConnection');
const config    = require('./config');

// use UTC time zone
class appHelper {
    constructor() {
        this.init();
    }

    init() {

    }

    // // get files from <fileinfo> table
    // async getDataFromFileInfo(conditions={}, size=50, skip=0) {
    //     console.log('|** appHelper.getDataFromFileInfo **| INFO: get data from <fileinfo> table for list view| ', new Date());
    //     let res = await DBConn.queryData('fileinfo', conditions, size, skip).catch(err => {console.log(err); return []});
    //     return res;
    // }

    // // get infos from <filemeta> table
    // async getDataFromFileMeta(conditions={}, size=999999) {
    //     console.log('|** appHelper.getDataFromFileMeta **| INFO: get data from <filemeta> table for detail view| ', new Date());
    //     let res = await DBConn.queryData('filemeta', conditions, size).catch(err => {console.log(err); return []});
    //     return res;
    // }

    // // update data into <fileinfo> table
    // async updateDataIntoFileInfo(data) {
    //     console.log('|** appHelper.updateDataIntoFileInfo **| INFO: update data into <fileinfo> table| ', new Date());
    //     if(data.length == 0) return 0;
        
    //     let timestamp = (new Date()).getTime();
    //     let deleteOperations = [];
    //     let operations = data.map(datum => {
    //         if(datum.manualreview == false) {
    //             deleteOperations.push({
    //                 deleteMany: {
    //                     filter: {md5: datum.md5}
    //                 }
    //             });
    //         }    
    //         return {
    //             updateOne: {
    //                 filter: {md5: datum.md5},
    //                 update: {$set: {
    //                     manualreview: datum.manualreview,
    //                     update: timestamp
    //                 }}
    //             }
    //         };
    //     });

    //     // console.log(JSON.stringify(operations));
    //     let res = await DBConn.updateData('fileinfo', operations).catch(err => {console.log(err); return err});
    //     if(deleteOperations.length > 0) {
    //         res = await DBConn.updateData('filemeta', deleteOperations).catch(err => {console.log(err); return err});
    //     }
    //     return res;
    // }

    // get files from <videos> table
    async getDataFromDB(conditions={}, size=50, skip=0) {
        console.log('|** appHelper.getDataFromDB **| INFO: get data from <videos> table for list view| ', new Date());
        let res = await DBConn.queryData('illegal', conditions, size, skip).catch(err => {console.log(err); return []});
        let num = await DBConn.count('illegal', conditions).catch(err => {console.log(err); return []});
        return {
            num: num,
            res: res
        };
    }

    // update data into table
    async updateDataIntoTable(table, data) {
        console.log(`|** appHelper.updateDataIntoTable **| INFO: update data into <${table}> table| `, new Date());
        if(data.length == 0) return 0;
        
        let timestamp = new Date();
        let operations = data.map(datum => {
            return {
                updateMany: {
                    filter: {uid: datum.uid},
                    update: {$set: {
                        manualreview: datum.manualreview,
                        update: timestamp
                    }}
                }
            };
        });

        console.log(JSON.stringify(operations));
        let res = await DBConn.updateData(table, operations).catch(err => {console.log(err); return err});
        return res;
    }

    getSystemStatus() {
        try{
            return new Promise(function(resolve, reject) {
                let p = [
                    DBConn.count('taskpool'),
                    DBConn.count('taskpool', {type: 'image'}),
                    DBConn.count('taskpool', {type: 'video'}),
                    DBConn.count('illegal'),
                    DBConn.count('illegal', {type: 'image'}),
                    DBConn.count('illegal', {type: 'video'})
                ];
                Promise.all(p).then(res => {
                    resolve({
                        taskpoolnum: res[0],
                        taskpoolimagenum: res[1],
                        taskpoolvideonum: res[2],
                        fileinfonum: res[3],
                        fileinfoimagenum: res[4],
                        fileinfovideonum: res[5]
                    });
                }).catch(err => reject(err));
            });
        }
        catch(err) {
            reject(err);
        }
    }
}

module.exports = appHelper;