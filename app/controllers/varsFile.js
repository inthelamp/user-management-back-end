const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { setupEasyRSA, writeToVarsFile, deleteEasyRSASetup }  = require("./shared");
const Issuer  = require("../models/issuer");
const VarsFile  = require("../models/varsFile");
const Certificate  = require("../models/certificate");

require("dotenv").config();

// Validating issuer data from client
const issuerSchema = Joi.object({
  country: Joi.string().valid(Issuer.Countries.CA, Issuer.Countries.US).required(),
  province: Joi.string().required(), 
  city: Joi.string().required(), 
  organization: Joi.string().required(), 
  email: Joi.string().required(), 
  organizationalUnit: Joi.string().required(), 
  commonName: Joi.string().required(),
  status: Joi.string().valid(Issuer.Statuses.Created_Vars, Issuer.Statuses.Generated_CA, Issuer.Statuses.Generated_DH, 
    Issuer.Statuses.Generated_Server, Issuer.Statuses.Generated_Client).required(),
});

// Validating varsFile data from client
const varsFileSchema = Joi.object({
  id: Joi.string(),
  issuer: issuerSchema.required(),
  keySize: Joi.number(),
  algorithm: Joi.string().valid(VarsFile.Algorithms.rsa, VarsFile.Algorithms.ec).required(),
  curve: Joi.string().valid(VarsFile.Curves.secp112r1, VarsFile.Curves.secp112r2, VarsFile.Curves.secp128r1, VarsFile.Curves.secp128r2, 
                            VarsFile.Curves.secp160k1, VarsFile.Curves.secp160r1, VarsFile.Curves.secp160r2, VarsFile.Curves.secp192k1, 
                            VarsFile.Curves.secp224k1, VarsFile.Curves.secp224r1, VarsFile.Curves.secp256k1, VarsFile.Curves.secp384r1, 
                            VarsFile.Curves.secp521r1, VarsFile.Curves.prime192v1, VarsFile.Curves.prime192v2, VarsFile.Curves.prime192v3, 
                            VarsFile.Curves.prime239v1, VarsFile.Curves.prime239v2, VarsFile.Curves.prime239v3, VarsFile.Curves.prime256v1, 
                            VarsFile.Curves.sect113r1, VarsFile.Curves.sect113r2, VarsFile.Curves.sect131r1, VarsFile.Curves.sect131r2, 
                            VarsFile.Curves.sect163k1, VarsFile.Curves.sect163r1, VarsFile.Curves.sect163r2, VarsFile.Curves.sect193r1, 
                            VarsFile.Curves.sect193r2, VarsFile.Curves.sect233k1, VarsFile.Curves.sect233r1, VarsFile.Curves.sect239k1, 
                            VarsFile.Curves.sect283k1, VarsFile.Curves.sect283r1, VarsFile.Curves.sect409k1, VarsFile.Curves.sect409r1,
                            VarsFile.Curves.sect571k1, VarsFile.Curves.sect571r1, VarsFile.Curves.c2pnb163v1, VarsFile.Curves.c2pnb163v2, 
                            VarsFile.Curves.c2pnb163v3, VarsFile.Curves.c2pnb176v1, VarsFile.Curves.c2tnb191v1, VarsFile.Curves.c2tnb191v2, 
                            VarsFile.Curves.c2tnb191v3, VarsFile.Curves.c2pnb208w1, VarsFile.Curves.c2tnb239v1, VarsFile.Curves.c2tnb239v2, 
                            VarsFile.Curves.c2tnb239v3, VarsFile.Curves.c2pnb272w1, VarsFile.Curves.c2pnb304w1, VarsFile.Curves.c2tnb359v1, 
                            VarsFile.Curves.c2pnb368w1, VarsFile.Curves.c2tnb431r1, VarsFile.Curves.wap_wsg_idm_ecid_wtls1, 
                            VarsFile.Curves.wap_wsg_idm_ecid_wtls3, VarsFile.Curves.wap_wsg_idm_ecid_wtls4, VarsFile.Curves.wap_wsg_idm_ecid_wtls5, 
                            VarsFile.Curves.wap_wsg_idm_ecid_wtls6, VarsFile.Curves.wap_wsg_idm_ecid_wtls7, VarsFile.Curves.wap_wsg_idm_ecid_wtls8, 
                            VarsFile.Curves.wap_wsg_idm_ecid_wtls9, VarsFile.Curves.wap_wsg_idm_ecid_wtls10, VarsFile.Curves.wap_wsg_idm_ecid_wtls11,
                            VarsFile.Curves.wap_wsg_idm_ecid_wtls12, VarsFile.Curves.Oakley_EC2N_3, VarsFile.Curves.Oakley_EC2N_4, 
                            VarsFile.Curves.brainpoolP160r1, VarsFile.Curves.brainpoolP160t1, VarsFile.Curves.brainpoolP192r1, 
                            VarsFile.Curves.brainpoolP192t1, VarsFile.Curves.brainpoolP224r1, VarsFile.Curves.brainpoolP224t1, 
                            VarsFile.Curves.brainpoolP256r1, VarsFile.Curves.brainpoolP256t1, VarsFile.Curves.brainpoolP320r1, 
                            VarsFile.Curves.brainpoolP320t1, VarsFile.Curves.brainpoolP384r1, VarsFile.Curves.brainpoolP384t1, 
                            VarsFile.Curves.brainpoolP512r1, VarsFile.Curves.brainpoolP512t1, VarsFile.Curves.SM2).required(),
  digest: Joi.string().valid(VarsFile.Digests.md5, VarsFile.Digests.sha1, VarsFile.Digests.sha224, VarsFile.Digests.sha256, VarsFile.Digests.sha384,
                             VarsFile.Digests.sha512).required(),
  caExpire: Joi.number(),
  certExpire: Joi.number(),
  certRenewDays: Joi.number(),
  crlDays: Joi.number(),
});

/**
 * Getting all vars settings files
 * @returns {json} retrun a JSON object
 */
module.exports.VarsFiles = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 

    // Retriving all vars files based on userid
    let varsFiles = await VarsFile.Model.find({ userId: userid }, { id: 1, issuer: 1, _id: 0 });

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
    const issuer = {
      country: req.body.country,
      province: req.body.province, 
      city: req.body.city, 
      organization: req.body.organization, 
      email: req.body.email, 
      organizationalUnit: req.body.organizationalUnit, 
      commonName: req.body.commonName,
      status: Issuer.Statuses.Created_Vars,
    }

    // Checking validation of issuer data
    const issuerResult = issuerSchema.validate(issuer);               
    if (issuerResult.error) {
      console.log(issuerResult.error.message);
      return res.status(400).json({
          error: true,
          message: issuerResult.error.message,
      });
    }

    var varsFile = {
      issuer: issuer,
      keySize: req.body.keySize,
      algorithm: req.body.algorithm,
      curve: req.body.curve,
      digest: req.body.digest,
      caExpire: req.body.caExpire,
      certExpire: req.body.certExpire,
      certRenewDays: req.body.certRenewDays,
      crlDays: req.body.crlDays,
    }

    const result = varsFileSchema.validate(varsFile);
    if (result.error) {
        return res.status(400).json({
            error: true,
            message: result.error.message,
        });
    }

    // Retrieving a vars settings based on cn 
    var varsFile = await VarsFile.Model.findOne({ "issuer.commonName": result.value.issuer.commonName });
    if (varsFile) {
      return res.status(400).json({
        error: true,
        message: "Vars settings record for " + result.value.issuer.commonName + " exists already."
      });
    }

    // Setting up easy-rsa vars file
    setupEasyRSA(result.value);

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
    const issuer = {
      country: req.body.country,
      province: req.body.province, 
      city: req.body.city, 
      organization: req.body.organization, 
      email: req.body.email, 
      organizationalUnit: req.body.organizationalUnit, 
      commonName: req.body.commonName,
      status: req.body.status,
    }

    // Checking validation of book cover image data
    const issuerResult = issuerSchema.validate(issuer);               
    if (issuerResult.error) {
      console.log(issuerResult.error.message);
      return res.status(400).json({
          error: true,
          message: issuerResult.error.message,
      });
    }

    var varsFile = {
      id: req.body.id,
      issuer: issuer,
      keySize: req.body.keySize,
      algorithm: req.body.algorithm,
      curve: req.body.curve,
      digest: req.body.digest,
      caExpire: req.body.caExpire,
      certExpire: req.body.certExpire,
      certRenewDays: req.body.certRenewDays,
      crlDays: req.body.crlDays,
    }
  
    const result = varsFileSchema.validate(varsFile);
    if (result.error) {
        console.log(result.error.message);
        return res.status(400).json({
            error: true,
            message: result.error.message,
        });
    }

    // updating easy-rsa settings in vars file 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + result.value.issuer.commonName;  
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
    varsFile.issuer = result.value.issuer;
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
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName; 
    deleteEasyRSASetup(certificateRootPath);

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

        // Checking if there are certificates related to the var file
        let certificates = Certificate.Model.find({varsFileId : id});

        if (certificates) {
          certificates.deleteMany(function(err) {
            if (err) {
              return res.status(500).json({
                error: true,
                message: err.message,
              });
            } 
          });
        }
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
    var varsFile = await VarsFile.Model.findOne({ id: id}, {userId: 0, _id: 0, __v: 0, createdAt: 0, updatedAt: 0});
    
    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars file is found."
      });
    }

    varsFile = { id: varsFile.id, country: varsFile.issuer.country, province: varsFile.issuer.province, city: varsFile.issuer.city, 
              organization: varsFile.issuer.organization, organizationalUnit: varsFile.issuer.organizationalUnit, email: varsFile.issuer.email, 
              commonName: varsFile.issuer.commonName, status: varsFile.issuer.status, keySize: varsFile.keySize, algorithm: varsFile.algorithm, 
              curve: varsFile.curve, digest: varsFile.digest, caExpire: varsFile.caExpire, certExpire: varsFile.certExpire, 
              certRenewDays: varsFile.certRenewDays, crlDays: varsFile.crlDays, 
    };

     
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