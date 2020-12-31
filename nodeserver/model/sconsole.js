
function sconsole() {}

sconsole.log = function(...args) {
    let flag = false;
    if(flag) {
        console.log(...args);
    }
}

sconsole.info = function(...args) {
    console.log(...args);
}

sconsole.warn = sconsole.log;

sconsole.error = function(...args) {
    console.log(...args);
}


module.exports = sconsole;