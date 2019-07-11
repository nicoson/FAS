
function sconsole() {}

sconsole.log = function(...args) {
    let flag = true;
    if(flag) {
        console.log(...args);
    }
}

sconsole.info = sconsole.log;
sconsole.warn = sconsole.log;
sconsole.error = sconsole.log;


module.exports = sconsole;