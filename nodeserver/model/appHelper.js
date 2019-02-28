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
        let res = await DBConn.queryData('results', conditions, size, skip).catch(err => {console.log(err); return []});
        let num = await DBConn.count('results', conditions).catch(err => {console.log(err); return []});
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
                    filter: {uri: datum.uri},
                    update: {$set: {
                        review_result: datum.manualreview,
                        audit_date: timestamp
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
                    DBConn.count('taskpool', {filetype: 'image'}),
                    DBConn.count('taskpool', {filetype: 'video'}),
                    DBConn.count('taskpool', {status: 'locked'}),
                    DBConn.count('fileinfo'),
                    DBConn.count('fileinfo', {filetype: 'image'}),
                    DBConn.count('fileinfo', {filetype: 'video'}),
                    DBConn.count('fileinfo', {$and: [{manualreview: null},{illegal: true}]}),
                    DBConn.count('fileinfo', {$and: [{manualreview: null},{illegal: true},{filetype: 'image'}]}),
                    DBConn.count('fileinfo', {$and: [{manualreview: null},{illegal: true},{filetype: 'video'}]}),
                    DBConn.count('fileinfo', {manualreview: true}),
                    DBConn.count('fileinfo', {$and: [{manualreview: true},{filetype: 'image'}]}),
                    DBConn.count('fileinfo', {$and: [{manualreview: true},{filetype: 'video'}]}),
                    DBConn.count('filemeta'),
                    DBConn.count('filemeta', {filetype: 'image'}),
                    DBConn.count('filemeta', {filetype: 'video'}),
                    DBConn.distinct('filemeta', 'meta.ip'),
                ];
                Promise.all(p).then(res => {
                    resolve({
                        taskpoolnum: res[0],
                        taskpoolimagenum: res[1],
                        taskpoolvideonum: res[2],
                        taskpoollocknum: res[3],
                        fileinfonum: res[4],
                        fileinfoimagenum: res[5],
                        fileinfovideonum: res[6],
                        fileinforeviewnum: res[7],
                        fileinforeviewimagenum: res[8],
                        fileinforeviewvideonum: res[9],
                        fileinforeviewtruenum: res[10],
                        fileinforeviewtrueimagenum: res[11],
                        fileinforeviewtruevideonum: res[12],
                        filemetanum: res[13],
                        filemetaimagenum: res[14],
                        filemetavideonum: res[15],
                        filemetaipnum: res[16]
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