const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { initPKI, generateCA, generateDH, generateServerCertificate, generateTA, generateClientCertificate }  = require("./shared");
const Issuer  = require("../models/issuer");
const VarsFile  = require("../models/varsFile");
const Certificate  = require("../models/certificate");

require("dotenv").config();

// Validating certificate data from client
const certificateSchema = Joi.object({
  id: Joi.string().required(),
  commonName: Joi.string().required(),
  category: Joi.string().valid(Certificate.Categories.CA, Certificate.Categories.Server, Certificate.Categories.Client).required(), 
  varsFileId: Joi.string().required(),
  deviceId: Joi.string(),
});

/**
 * Getting certificates for the issuer
 * @returns {json} retrun a JSON object
 */
module.exports.Certificates = async (req, res) => {
  try {
    const id = req.headers.id;
    
    // Retriving all certificates based on varfileId
    var certificates = await Certificate.Model.find({ varsFileId: id }, { _id: 0 });
  
    if (!certificates) {
      return res.status(400).json({
        error: true,
        message: 'No certificates are found',
      });
    }
    
    return res.status(200).json({
      success: true,
      certificates: certificates,
      message: "All certificates related to the issuer are successfully retrieved.",
    });
  } catch (error) {
    console.error("Error occurs in retrieving certificates ", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

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

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for initializing PKI."
      });
    }


    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    initPKI(certificateRootPath, certificateLogPath);

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

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating CA."
      });
    }

    //Saving CA certificate record
    const certificateId = uuid(); // Generating unique id for the certificate.
    var certificate = {
      id: certificateId,
      commonName: varsFile.issuer.commonName,
      category: Certificate.Categories.CA,
      varsFileId: varsFile.id
    }

    // Checking validation of certificate data
    const result = certificateSchema.validate(certificate);
    if (result.error) {
        return res.status(400).json({
            error: true,
            message: result.error.message,
        });
    }

    // Retrieving a certificate based on cn 
    var certificate = await Certificate.Model.findOne({ "commonName": result.value.commonName });
    if (certificate) {
      return res.status(400).json({
        error: true,
        message: "The certificate for " + result.value.commonName + " exists already."
      });
    }

    // Performing build-ca to create CA 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateCA(certificateRootPath, certificateLogPath);

    // Updating vars settings in DB 
    varsFile.issuer.status = Issuer.Statuses.Generated_CA;
    // Saving into DB
    await varsFile.save();    

    certificate = new Certificate.Model(result.value);    
    // Saving into DB
    await certificate.save(); 

    return res.status(200).json({
      success: true,
      id: varsFile.id,
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

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating DH."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    generateDH(certificateRootPath, certificateLogPath);

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
 * Generating certificate
 * @returns {json} retrun a JSON object
 */
module.exports.GenerateCertificate = async (req, res) => {
  try {    
    const id = req.headers.id;
    const commonName = req.headers.common_name;
    const certificateName = req.headers.certificate_name;
    const certificateCategory =  req.headers.certificate_category;
    
    if (!id || !commonName || !certificateName || !certificateCategory) {
      return res.status(400).json({
        error: true,
        message: "Required information to generate certificate is not provided."
      });
    }

    // Retrieving a vars settings based on varsFile id and userid
    var varsFile = await VarsFile.Model.findOne({ id : id });

    if (!varsFile) {
      return res.status(400).json({
        error: true,
        message: "No vars settings record is found for generating a certificate."
      });
    }

    //Saving CA certificate record
    const certificateId = uuid(); // Generating unique id for the certificate.
    var certificate = {
      id: certificateId,
      commonName: certificateName + '.' + varsFile.issuer.commonName,
      category: certificateCategory,
      varsFileId: varsFile.id
    }

    // Checking validation of certificate data
    const result = certificateSchema.validate(certificate);
    if (result.error) {
        return res.status(400).json({
            error: true,
            message: result.error.message,
        });
    }

    // Retrieving a certificate based on cn 
    var certificate = await Certificate.Model.findOne({ "commonName": result.value.commonName });
    if (certificate) {
      return res.status(400).json({
        error: true,
        message: "The certificate for " + result.value.commonName + " exists already."
      });
    }

    // Performing init-pki for certificate 
    const certificateRootPath = process.env.EASYRSA_ROOT_PATH + '/' + commonName;  
    const certificateLogPath = certificateRootPath + '/easyrsa.log';
    if (certificateCategory == Certificate.Categories.Client) {
      generateClientCertificate(certificateName, certificateRootPath, certificateLogPath);      
      // Updating vars settings in DB 
      varsFile.issuer.status = Issuer.Statuses.Generated_Client;
    } else  if (certificateCategory == Certificate.Categories.Server) {
      generateServerCertificate(certificateName, certificateRootPath, certificateLogPath);
      // Updating vars settings in DB 
      varsFile.issuer.status = Issuer.Statuses.Generated_Server;
    }

    // Saving into DB
    await varsFile.save();     

    certificate = new Certificate.Model(result.value);    
    // Saving into DB
    await certificate.save(); 

    return res.status(200).json({
      success: true,
      id: id,
      message: "Generating a certificate using EasyRSA is successfully completed!.",
    });
  } catch (error) {
    console.error("Generating certificate error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }  
}