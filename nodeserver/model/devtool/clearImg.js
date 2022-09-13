process.env.ENV = 'DEV';
process.env.SCENE = 'WASH';

const fs	 = require('fs');
const DBConn = require('./DBConnection');

const filedir = '../public/files';
let count = 0;

async function a() {
    let data = await DBConn.queryDataCol('taskpool', {uid:{$gt:1559722468117}});
    console.log('data length: ', data.length);
    let list = data.map(datum => {return datum.uid.toString()});
    // console.log(list);

    let files = fs.readdirSync(filedir);
    console.log(files.length);

    for(let i of files) {
        if(list.indexOf(i) < 0) {
            count++;
            console.log(`----------->  file ${i} deleted, totally ${count}`);
            fs.unlinkSync(`${filedir}/${i}`);
        }
    }

    // let ind = 0;
    // let concurrency = 0;
    // while(ind < files.length) {
    //     let single = files[ind];
    //     if(parseInt(single) > 1560787200000 && list.indexOf(single) < 0) {
    //         if(concurrency < 50) {
    //             concurrency++;
    //             try{
    //                 fs.unlink(`${filedir}/${single}`, function(){
    //                     count++;
    //                     concurrency--;
    //                     console.log(`----------->  file ${single} deleted, totally ${count}`);
    //                 });
    //             }
    //             catch(err) {
    //                 console.log(err);
    //             }
                
    //             ind++;
    //         } else {
    //             await sleep(100);
    //         }
    //     } else {
    //         ind++;
    //     } 
    //     console.log(`=========> current ind: ${ind}`);
    // }
}

async function sleep(period) {
    return new Promise(function(resolve, reject){
        setTimeout(function(){resolve(1)}, period);
    });
}

a().then(e=>console.log('done'));
