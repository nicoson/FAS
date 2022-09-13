process.env.ENV = 'DEV';
process.env.SCENE = 'WASH';
const DBConn = require('../DBConnection');


async function main() {
    await sleep(2000);

    let conditions = {
        $and: [
            {type: 'image'}
        ]
    }

    let ops = [];
    ops.push({'rets.scenes.pulp.suggestion': 'block'});
    ops.push({'rets.scenes.terror.suggestion': 'block'});
    ops.push({'rets.scenes.politician.suggestion': {$ne:"pass"}});
    conditions.$and.push({$or: ops});

    let res = await DBConn.queryData('taskpool', conditions, 200, 0, 1).catch(err => {sconsole.log(err); return []});
    console.log('res: ', res);
}

async function sleep(period) {
    return new Promise(function(resolve, reject){
        setTimeout(function(){resolve(1)}, period);
    });
}

main().then(e=>console.log('done'));
