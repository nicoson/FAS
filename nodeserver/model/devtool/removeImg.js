process.env.ENV = 'DEV';
process.env.SCENE = 'WASH';

const fs	 = require('fs');
const DBConn = require('./DBConnection');

const filedir = '../public/files';
let count = 0;


async function core(len = 1000) {
    //  删除人工标记为正常的数据
    let data = await DBConn.queryData('illegal', {manualreview:false}, len, len*count);
    console.log('data length: ', data.length);
    
    for(let i=0; i<data.length; i++) {
        await fs.unlinkSync(`${filedir}/${data[i].uri.split('/').slice(4).join('/')}`).catch(err => console.log('remove error: ', err));
    }
    return data.length;
}

async function main() {
    let res = await core(1000);
    while(res == 1000) {   //  如果剩余的数据大于1000，则继续删除
        res = await core(1000);
        count++;
        console.log(1000*count,' data removed !');
    }
}

// async function sleep(period) {
//     return new Promise(function(resolve, reject){
//         setTimeout(function(){resolve(1)}, period);
//     });
// }

main().then(e=>console.log('done'));
