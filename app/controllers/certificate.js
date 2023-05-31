const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { initPKI, generateCA, generateDH, generateServerCertificate, generateTA, generateClientCertificate }  = require("./shared");
const Issuer  = require("../models/issuer");
const VarsFile  = require("../models/varsFile");

require("dotenv").config();

// Validating certificateAuthority data from client
const certificateAuthoritySchema = Joi.object({
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
 * Perform init-pki
 * @returns {json} retrun a JSON object
 */
module.exports.InitPKI = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    initPKI(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for initializing PKI."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Initialized_PKI;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "EasyRSA init-pki success!.",
    });

  } catch (error) {
    console.error("Init PKI error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Generating CA
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateCA = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateCA(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating CA."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_CA;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating CA using EasyRSA is successfully complete!.",
    });

  } catch (error) {
    console.error("Generating CA error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
};

/**
 * Generating DH
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateDH = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateDH(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating DH."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_DH;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating DH using EasyRSA is successfully complete!.",
    });

  } catch (error) {
    console.error("Generating DH error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
};


/**
 * Generating server certificate
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateServer = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateServerCertificate(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating server certificate."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_Server;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating server certificate using EasyRSA is successfully complete!.",
    });

  } catch (error) {
    console.error("Generating server certificate error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
}

/**
 * Generating TA
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateTA = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateTA(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating TA."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_TA;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating TA using openvpn is successfully complete!.",
    });

  } catch (error) {
    console.error("Generating TA error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
};

/**
 * Generating server certificate
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateClient = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    
    if (!id || !commonName) {
      return res.status(400).json({
        error: true,
        message: "Vars id or common name is not provided."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateClientCertificate(certificateRootPath, certificateLogPath);

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating client certificate."
      });
    }

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_Client;

    // Saving into DB
    await varsFile.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating client certificate using EasyRSA is successfully complete!.",
    });

  } catch (error) {
    console.error("Generating client certificate error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
}

/**
 * Getting a certificateAuthority published
 * @returns {json} retrun a JSON object
 */
 module.exports.CertificateAuthority = async (req, res) => {
  try {    
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "CertificateAuthority id is not provided."
      });
    }

    // Retriving a published certificateAuthority based on id
    // Using lean to decode image as base64
    const certificateAuthority = await VarsFile.Model.findOne({ id: id, status: "Published" }, { _id: 0, __v: 0, bookCover: { _id: 0, updatedAt: 0 }}).lean();

    if (!certificateAuthority) {
      return res.json({
        error: true,
        status: 400,
        message: "No certificateAuthority is found."
      });
    }

    return res.status(200).json({
      success: true,
      certificateAuthority,
      message: "CertificateAuthority is successfully retrieved.",
    });
  } catch (error) {
    console.error("Getting certificateAuthority error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};