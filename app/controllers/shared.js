const exec = require("child_process").exec;

/**
 * Executes a command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
const execProcess = ( cmd ) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
         if (error) {
          console.warn(error);
         }
         resolve(stdout? stdout : stderr);
        });
    });
}


module.exports = {  
    execProcess
};