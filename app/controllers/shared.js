const { exec, execSync } = require("child_process");
const fs = require('fs');
const path = require('path');

/**
 * Executes a command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
const execProcessPromise = async ( cmd ) => {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

// Checking if a file exists or not
const doFileExist = ( fileName ) => {
    try {
        fs.accessSync(fileName, fs.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

const deleteFile = (path) => {
    if (path) {
      fs.access(path, (err) => {
        if (err) {
          console.log(err);
          return;
        }
    
        fs.unlink(path, (err) => {
          if (err) throw err;
          console.log(`${path} was deleted.`);
        });
      });
    }
}

// Logging output messages
const log = ( cmd, fileName, message ) => {
    if (typeof message === "object") {
        message = message.toString();
    }

    if (!message.trim()) {
        message = "Successfully performed: " + cmd;
    }

    var logStream = fs.createWriteStream(fileName, {flags: 'a'});
    logStream.write(message + ' ['  +  new Date().toLocaleString()  + ']\n');
    logStream.end('================================================== END ===============================================\n');
}

const writeToVarsFile = ( varsSettings, certificateRootPath, certificateLogPath ) => {
    const easyrsaVarsFilePath = certificateRootPath + '/vars';

    try {
        // Deleting vars file if exists
        if (doFileExist( easyrsaVarsFilePath )) { 
            fs.unlinkSync(easyrsaVarsFilePath);
            log('', certificateLogPath, easyrsaVarsFilePath + ' was deleted.');
        } 

        var fd = fs.openSync(easyrsaVarsFilePath, 'w');
        let setVar = 'set_var EASYRSA_DN     "org"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_COUNTRY\t' + '"' + varsSettings.country + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_PROVINCE\t' + '"' + varsSettings.province + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_CITY\t' + '"' + varsSettings.city + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_ORG\t' + '"' + varsSettings.organization + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_EMAIL\t' + '"' + varsSettings.email + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_OU\t' + '"' + varsSettings.organizationalUnit + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_KEY_SIZE\t' + varsSettings.keySize;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_ALGO\t' + varsSettings.algorithm;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CURVE\t' + varsSettings.curve;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CA_EXPIRE\t' + varsSettings.caExpire;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CERT_EXPIRE\t' + varsSettings.certExpire;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CERT_RENEW\t' + varsSettings.certRenewDays;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CRL_DAYS\t' + varsSettings.crlDays;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_REQ_CN\t' + '"' + varsSettings.commonName + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_DIGEST\t' + '"' + varsSettings.digest + '"';
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CA_PASS_FILE     .' + process.env.EASYRSA_CA_PASS_FILE;
        fs.writeSync(fd, setVar + '\n');
        setVar = 'set_var EASYRSA_CA_PASS_SIZE    ' + process.env.EASYRSA_CA_PASS_SIZE;
        fs.writeSync(fd, setVar);
    
        // close the file
        fs.closeSync(fd);

        log('', certificateLogPath, 'Successfully created vars file and saved settings: ' + easyrsaVarsFilePath );
    } catch ( error ) {
        throw error;
    }
}

const setupVars = ( varsSettings, certificateRootPath, certificateLogPath) => {
    var cmd = '';
    var execResults = '';

    try {        
        // Making a root directory with ther common name of VarsFile 
        cmd = 'mkdir ' + certificateRootPath; 
        if (!doFileExist( certificateRootPath )) {
            execSync(cmd);
            execResults = 'Certificate root directory is created: ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
        } else {
            execResults = 'Certificate root directory exists: ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
        }

        // Creating log file
        cmd = 'touch ' + certificateLogPath; 
        if (!doFileExist( certificateLogPath )) {
            execSync(cmd);
            execResults = 'Certificate log file is created: ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
        } else {
            execResults = 'Certificate log file exists: ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
        }
         
        // Saving vars settings to vars file
        writeToVarsFile(varsSettings, certificateRootPath, certificateLogPath);

    } catch ( error ) {
        throw error;
    }
}

const setupEasyRSA = ( varsSettings ) => {
    var cmd = '';
    var execResults = '';

    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + varsSettings.commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';

    try {
        // Setting up vars file
        setupVars( varsSettings, certificateRootPath, certificateLogPath);

        // Copying esarsa file
        const easyrsaPath = certificateRootPath + '/easyrsa';
        cmd = 'cp ' + process.env.EASYRSA_SRC_PATH + '/easyrsa ' + process.env.EASYRSA_ROOT_PATH + '/' + varsSettings.commonName + '/.'; 
        if (!doFileExist( easyrsaPath )) {
            execResults = execSync(cmd);        
            log(cmd, certificateLogPath, execResults);
        } else {
            execResults = 'Certificate easyrsa file exists: ' + cmd ;
            log('', certificateLogPath, execResults);
        }

        // Copying configuration file
        const easyrsaConfigPath = certificateRootPath + '/openssl-easyrsa.cnf';
        cmd = 'cp ' + process.env.EASYRSA_SRC_PATH + '/openssl-easyrsa.cnf ' + process.env.EASYRSA_ROOT_PATH  + '/' + varsSettings.commonName + '/.'; 
        if (!doFileExist( easyrsaConfigPath )) {
            execResults = execSync(cmd);
            log(cmd, certificateLogPath, execResults);
        } else {
            execResults = 'Certificate configuration file exists: ' + cmd ;
            log('', certificateLogPath, execResults);
        }

        // Copying x509-types directory
        const easyrsaX509TypesPath = certificateRootPath + '/x509-types';
        cmd = 'cp -rf ' + process.env.EASYRSA_SRC_PATH + '/x509-types ' + process.env.EASYRSA_ROOT_PATH  + '/' + varsSettings.commonName + '/.'; 
        if (!doFileExist( easyrsaX509TypesPath )) {
            execResults = execSync(cmd);
            log(cmd, certificateLogPath, execResults);
        } else {
            execResults = 'Certificate x509-types directory exists: ' + cmd ;
            log('', certificateLogPath, execResults);
        }
    } catch ( error ) {
        throw error;
    }
}

const deleteEasyRSASetup = ( certificateRootPath ) => {
    var execResults = '';
    const cmd = 'rm -rf ' + certificateRootPath;

    try {
        // Making a root directory with ther common name of VarsFile  
        if (doFileExist( certificateRootPath )) {
            execSync(cmd);
            execResults = 'Certificate root directory is deleted ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
        } else {
            execResults = 'No certificate root directory exists: ' + cmd;
            log('', process.env.EASYRSA_LOG_PATH, execResults);
            throw new Error(execResults); 
        }
    } catch ( error ) {
        throw error;
    }
}

module.exports = {
    setupEasyRSA,
    writeToVarsFile,
    deleteEasyRSASetup
};