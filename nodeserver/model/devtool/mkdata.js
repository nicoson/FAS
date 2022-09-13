process.env.ENV = 'DEV';
process.env.SCENE = 'WASH';
const DBConn = require('../DBConnection');


async function core() {
    let data = [];
    
    for(let i=0; i<100; i++) {
        data.push({
            uid: new Date().getTime() + '' + Math.round(Math.random()*10000),
            // name: file.meta.pic_name,
            type: 'image',
            uri: `http://100.100.140.18:3000/files/image/20201231/160940135518506240`,
            info: {
                id: Math.round(Math.random()*10000)
            },
            create: new Date(),
            update: new Date().getTime()
        });
    }
    
    let res = await DBConn.insertData('taskpool', data).catch(err => console.log(err));
}

async function main() {
    await sleep(2000);
    for(let i=0; i<30000; i++) {
        if(i%100 == 0) {
            console.log(new Date().toJSON(), '    now finished: ', i);
        }
        await core();
    }
}

async function sleep(period) {
    return new Promise(function(resolve, reject){
        setTimeout(function(){resolve(1)}, period);
    });
}

main().then(e=>console.log('done'));
