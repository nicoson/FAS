process.env.ENV = 'DEV';
process.env.SCENE = 'WASH';

var fs = require('fs'); // 引入fs模块
const DBConn  = require('./DBConnection');

// const filename = 'job.sh';
let count = 0;

async function a() {
    let data = await DBConn.queryDataCol('illegal',{uid:{$gt:1570593207108*100000}}); // 20191009 11:53
    let len = data.length;
    console.log('data length: ', data.length);
    let list = data.map(datum => {return datum.uid.toString()});
    data = null;
    // let content = data.map((datum, ind) => {return `cp ../public/files/${datum} /home/qnai/nixiaohui/temp/${datum}; echo ${ind};`});
    
    for(let datum of list) {
        // console.log();
        if(!fs.existsSync(`../public/files/${datum}`)) continue;
        fs.writeFileSync(`../public/temp/${datum}`, fs.readFileSync(`../public/files/${datum}`));
        count++;
        if(count%100 == 0) {
            console.log(`----------->  total ${count}/${len} file copied`);
        }
    }
}



a().then(e=>console.log('done'));
