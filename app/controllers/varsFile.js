const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { setupVars, writeToVarsFile, deleteVars }  = require("./shared");
const VarsFile  = require("../models/varsFile");

require("dotenv").config();

// Validating varsFile data from client
const varsFileSchema = Joi.object({
  id: Joi.string(),
  country: Joi.string().valid('CA', 'US').required(),
  province: Joi.string().required(), 
  city: Joi.string().required(), 
  organization: Joi.string().required(), 
  email: Joi.string().required(), 
  organizationalUnit: Joi.string().required(), 
  keySize: Joi.number(),
  algorithm: Joi.string().valid("rsa", "ec").required(),
  curve: Joi.string().valid("secp112r1", "secp112r2", "secp128r1", "secp128r2", "secp160k1", "secp160r1", "secp160r2", "secp192k1", "secp224k1",
                            "secp224r1", "secp256k1", "secp384r1", "secp521r1", "prime192v1", "prime192v2", "prime192v3", "prime239v1", "prime239v2",
                            "prime239v3", "prime256v1", "sect113r1", "sect113r2", "sect131r1", "sect131r2", "sect163k1", "sect163r1", "sect163r2",
                            "sect193r1", "sect193r2", "sect233k1", "sect233r1", "sect239k1", "sect283k1", "sect283r1", "sect409k1", "sect409r1",
                            "sect571k1", "sect571r1", "c2pnb163v1", "c2pnb163v2", "c2pnb163v3", "c2pnb176v1", "c2tnb191v1", "c2tnb191v2", "c2tnb191v3", 
                            "c2pnb208w1", "c2tnb239v1", "c2tnb239v2", "c2tnb239v3", "c2pnb272w1", "c2pnb304w1", "c2tnb359v1", "c2pnb368w1", "c2tnb431r1", 
                            "wap-wsg-idm-ecid-wtls1", "wap-wsg-idm-ecid-wtls3", "wap-wsg-idm-ecid-wtls4", "wap-wsg-idm-ecid-wtls5", "wap-wsg-idm-ecid-wtls6",
                            "wap-wsg-idm-ecid-wtls7", "wap-wsg-idm-ecid-wtls8", "wap-wsg-idm-ecid-wtls9", "wap-wsg-idm-ecid-wtls10", "wap-wsg-idm-ecid-wtls11",
                            "wap-wsg-idm-ecid-wtls12", "Oakley-EC2N-3", "Oakley-EC2N-4", "brainpoolP160r1", "brainpoolP160t1", "brainpoolP192r1", "brainpoolP192t1",
                            "brainpoolP224r1", "brainpoolP224t1", "brainpoolP256r1", "brainpoolP256t1", "brainpoolP320r1", "brainpoolP320t1", "brainpoolP384r1",
                            "brainpoolP384t1", "brainpoolP512r1", "brainpoolP512t1", "SM2").required(),
  digest: Joi.string().valid("md5", "sha1", "sha256", "sha224", "sha384", "sha512").required(),
  caExpire: Joi.number(),
  certExpire: Joi.number(),
  certRenewDays: Joi.number(),
  crlDays: Joi.number(),
  commonName: Joi.string().required(),
});

/**
 * Getting all issuers
 * @returns {json} retrun a JSON object
 */
module.exports.Issuers = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 

    // Retriving all reviews based on userid
    let issuers = await VarsFile.Model.find({ userId: userid }, { id: 1, country: 1, province: 1, city: 1, organization: 1, organizationalUnit: 1, commonName: 1, email: 1, _id: 0 });

    if (!issuers) {
      return res.status(400).json({
        error: true,
        message: 'No vars settings file records are found',
      });
    }

    return res.status(200).json({
      success: true,
      issuers: issuers,
      message: "All issuers from vars settings are successfully retrieved.",
    });
  } catch (error) {
    console.error("Error occurs in retrieving issuers from vars settings ", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};


/**
 * Getting all vars settings files
 * @returns {json} retrun a JSON object
 */
module.exports.VarsFiles = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 

    // Retriving all reviews based on userid
    let varsFiles = await VarsFile.Model.find({ userId: userid }, { id: 1, country: 1, province: 1, city: 1, organization: 1, organizationalUnit: 1, commonName: 1, email: 1, _id: 0 });

    if (!varsFiles) {
      return res.status(400).json({
        error: true,
        message: 'No vars settings file records are found',
      });
    }

    return res.status(200).json({
      success: true,
      varsFiles,
      message: "All vars settings files are successfully retrieved.",
    });
  } catch (error) {
    console.error("Retrieving vars settings files error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Creating easyrsa vars settings
 * @returns {json} retrun a JSON object
 */
module.exports.Create = async (req, res) => {
  try {
    const result = varsFileSchema.validate(req.body);
    if (result.error) {
        return res.status(400).json({
            error: true,
            message: result.error.message,
        });
    }

    // Retrieving a vars settings based on cn 
    var varsFile = await VarsFile.Model.findOne({ commonName: result.value.commonName });

    if (varsFile) {
      return res.status(400).json({
        error: true,
        message: "Vars settings record for " + result.value.commonName + " exists already."
      });
    }

    // Setting up easy-rsa vars file
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + result.value.commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    setupVars(result.value, certificateRootPath, certificateLogPath);

    const userid = req.decoded.userid; // Passed by verifyJwt, a middleware 
    const id = uuid(); // Generating unique id for the varsFile.

    result.value.id = id; 
    result.value.userId = userid; 

    varsFile = new VarsFile.Model(result.value);    

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Vars file is successfully created and saved",
    });
  } catch (error) {
    console.error("Creating vars file error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Updating easyrsa vars settings
 * @returns {json} retrun a JSON object
 */
module.exports.Update = async (req, res) => {
  try {
    const result = varsFileSchema.validate(req.body);
    if (result.error) {
        console.log(result.error.message);
        return res.json({
            error: true,
            status: 400,
            message: result.error.message,
        });
    }

    // updating easy-rsa settings in vars file 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + result.value.commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    writeToVarsFile(result.value, certificateRootPath, certificateLogPath);

    result.value.userId = req.decoded.userid; // Passed by verifyJwt, a middleware

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : result.value.id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for update."
      });
    }

    // Updating vars settings in DB 
    varsFile.userId = req.decoded.userid; // Passed by verifyJwt, a middleware 
    varsFile.country = result.value.country;
    varsFile.province =  result.value.province;
    varsFile.city = result.value.city;
    varsFile.organization = result.value.organization;
    varsFile.email = result.value.email;
    varsFile.organizationalUnit = result.value.organizationalUnit;
    varsFile.keySize = result.value.keySize;
    varsFile.algorithm = result.value.algorithm;
    varsFile.curve = result.value.curve;
    varsFile.digest = result.value.digest;
    varsFile.caExpire = result.value.caExpire;
    varsFile.certExpire = result.value.certExpire;
    varsFile.certRenewDays = result.value.certRenewDays;
    varsFile.crlDays = result.value.crlDays;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: result.value.id,
      message: "Vars file is successfully updated",
    });
  } catch (error) {
    console.error("Updating vars file error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Delete a varsFile posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.Delete = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // deleting easy-rsa vars file 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + commonName; 
    deleteVars(certificateRootPath);

    // Retriving a varsFile based on varsFile id and userid
    let varsFile = await VarsFile.Model.findOne({ id: id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings file to be deleted is found."
      });
    }

    varsFile.deleteOne(function(err) {
      if (err) {
        return res.status(500).json({
          error: true,
          message: err.message,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Vars file is successfully deleted.",
        });
      }
    });
  } catch (error) {
    console.error("Deleting vars file error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting a varsFile
 * @returns {json} retrun a JSON object
 */
module.exports.VarsFile = async (req, res) => {
  try {    
    const id = req.headers.id; // From header

    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Vars id is not provided."
      });
    }

    // Retriving a vars file based on id
    const varsFile = await VarsFile.Model.findOne({ id: id}, {userId: 0, _id: 0, __v: 0, createdAt: 0, updatedAt: 0});
    
    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars file is found."
      });
    }

    return res.status(200).json({
      success: true,
      varsFile,
      message: "A vars file is successfully retrieved.",
    });
  } catch (error) {
    console.error("Getting vars file error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};