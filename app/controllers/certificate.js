const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { setupCertificate }  = require("./shared");
const CertificateAuthority  = require("../models/varsFile");

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

const deleteFile = (file) => {
  if (file) {
    var fs = require('fs');
    fs.access(file.path, (err) => {
      if (err) {
        console.log(err);
        return;
      }
  
      fs.unlink(file.path, (err) => {
        if (err) throw err;
        console.log(`${file.filename} was deleted.`);
      });
    });
  }
}

/**
 * Setup Certificate Authority environment
 * @returns {json} retrun a JSON object
 */
module.exports.Setup = async (req, res) => {
  try {

    // Getting review form data
    const varsFormData = req.body;
    varsFormData.country = req.body.country;
    varsFormData.province =  req.body.province;
    varsFormData.city = req.body.city;
    varsFormData.organization = req.body.organization;
    varsFormData.email = req.body.email;
    varsFormData.organizationalUnit = req.body.organizationalUnit;
    varsFormData.keySize = req.body.keySize;
    varsFormData.algorithm = req.body.algorithm;
    varsFormData.curve = req.body.curve;
    varsFormData.digest = req.body.digest;
    varsFormData.caExpire = req.body.caExpire;
    varsFormData.certExpire = req.body.certExpire;
    varsFormData.certRenewDays = req.body.certRenewDays;
    varsFormData.crlDays = req.body.crlDays;
    varsFormData.commonName = req.body.commonName;

    const result = certificateAuthoritySchema.validate(varsFormData);
    if (result.error) {
        console.log(result.error.message);
        return res.json({
            error: true,
            status: 400,
            message: result.error.message,
        });
    }

    // setup easy-rsa files and directories
    setupCertificate(result.value);

    const userid = req.decoded.userid; // Passed by verifyJwt, a middleware 
    const id = uuid(); // Generating unique id for the certificateAuthority.
    result.value.id = id; 
    result.value.userId = userid; 

    // Retriving a certificateAuthority based on certificateAuthority id and userid
    var certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, userId : userid });

    if (certificateAuthority) {
      // Updating certificate Authority 
      certificateAuthority.country = result.value.country;
      certificateAuthority.province =  result.value.province;
      certificateAuthority.city = result.value.city;
      certificateAuthority.organization = result.value.organization;
      certificateAuthority.email = result.value.email;
      certificateAuthority.organizationalUnit = result.value.organizationalUnit;
      certificateAuthority.keySize = result.value.keySize;
      certificateAuthority.algorithm = result.value.algorithm;
      certificateAuthority.curve = result.value.curve;
      certificateAuthority.digest = result.value.digest;
      certificateAuthority.caExpire = result.value.caExpire;
      certificateAuthority.certExpire = result.value.certExpire;
      certificateAuthority.certRenewDays = result.value.certRenewDays;
      certificateAuthority.crlDays = result.value.crlDays;
      certificateAuthority.commonName = result.value.commonName;
    } else {
      certificateAuthority = new CertificateAuthority.Model(result.value);
    }

    // Saving into DB
    await certificateAuthority.save();     

    return res.status(200).json({
      success: true,
      id: id,
      message: "Certificate authority environment is successfully set up",
    });
  } catch (error) {
    console.error("Certificate authority environment setup error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Create Certificate Authority
 * @returns {json} retrun a JSON object
 */
module.exports.CreateCA = async (req, res) => {
  try {

    // Getting review form data
    const varsFormData = req.body;
    varsFormData.country = req.body.country;
    varsFormData.province =  req.body.province;
    varsFormData.city = req.body.city;
    varsFormData.organization = req.body.organization;
    varsFormData.email = req.body.email;
    varsFormData.organizationalUnit = req.body.organizationalUnit;
    varsFormData.keySize = req.body.keySize;
    varsFormData.algorithm = req.body.algorithm;
    varsFormData.curve = req.body.curve;
    varsFormData.digest = req.body.digest;
    varsFormData.caExpire = req.body.caExpire;
    varsFormData.certExpire = req.body.certExpire;
    varsFormData.certRenewDays = req.body.certRenewDays;
    varsFormData.crlDays = req.body.crlDays;
    varsFormData.commonName = req.body.commonName;

    const result = certificateAuthoritySchema.validate(varsFormData);
    if (result.error) {
        console.log(result.error.message);
        return res.json({
            error: true,
            status: 400,
            message: result.error.message,
        });
    }

    // setup easy-rsa directories
    setupCertificate(result.value);

    // excute easy-rsa to create the certificate authority


    const userid = req.decoded.userid; // Passed by verifyJwt, a middleware 
    const id = uuid(); // Generating unique id for the certificateAuthority.
    result.value.id = id; 
    result.value.userId = userid; 
    
    const newCA = new CertificateAuthority.Model(result.value);
    await newCA.save(); // Saving into DB

    return res.status(200).json({
      success: true,
      id: id,
      message: "Certificate authority is successfully saved.",
    });
  } catch (error) {
    console.error("Certificate authority save error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Updating certificateAuthority
 * @returns {json} retrun a JSON object
 */
module.exports.UpdateCA = async (req, res) => {
  try {
    // Getting certificateAuthority form data
    const certificateAuthorityFormData = req.body;
    certificateAuthorityFormData.bookTitle = req.body.bookTitle ? req.body.bookTitle : undefined;
    certificateAuthorityFormData.bookAuthors = req.body.bookAuthors ? JSON.parse(req.body.bookAuthors) : undefined;
    certificateAuthorityFormData.isbn = req.body.isbn ? req.body.isbn : undefined;
    certificateAuthorityFormData.bookCover = req.body.bookCover ? req.body.bookCover : undefined;
    certificateAuthorityFormData.feedbacks = req.body.feedbacks ? req.body.feedbacks : undefined;

    // Checking validation of certificateAuthority form data
    const certificateAuthorityResult = certificateAuthoritySchema.validate(certificateAuthorityFormData);
    if (certificateAuthorityResult.error) {
        console.log(certificateAuthorityResult.error.message);
        return res.json({
            error: true,
            status: 400,
            message: certificateAuthorityResult.error.message,
        });
    }

    // Passed by verifyJwt, a middleware 
    const userid = req.decoded.userid; 
    const id = certificateAuthorityResult.value.id; 
    // Retriving a certificateAuthority based on certificateAuthority id and userid
    const certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, userId : userid });

    if (!certificateAuthority) {
      return res.json({
        error: true,
        status: 400,
        message: "No certificateAuthority is found for update."
      });
    }

    // Updating certificateAuthority 
    certificateAuthority.subject = certificateAuthorityResult.value.subject;
    certificateAuthority.bookTitle = certificateAuthorityResult.value.bookTitle;
    certificateAuthority.bookAuthors = certificateAuthorityResult.value.bookAuthors;
    certificateAuthority.isbn = certificateAuthorityResult.value.isbn;
    certificateAuthority.content = certificateAuthorityResult.value.content;
    certificateAuthority.status = certificateAuthorityResult.value.status;

    // Getting data of book cover image 
    if (req.file) { 
      // Creating buffer with base64 encoding
      let buffer = new Buffer.from(req.file.buffer, 'base64')
      const bookCover = {
        id: uuid(),
        fileName: req.file.originalname,
        mimetype: req.file.mimetype,   
        size: req.file.size,
        bytes: buffer, // from memory storage
      }

      // Checking validation of book cover image data
      const bookCoverResult = imageSchema.validate(bookCover);               
      if (bookCoverResult.error) {
        console.log(bookCoverResult.error.message);
        return res.json({
            error: true,
            status: 400,
            message: bookCoverResult.error.message,
        });
      }
      certificateAuthority.bookCover = bookCoverResult.value;
    }

    // Saving into DB
    await certificateAuthority.save(); 

    return res.status(200).json({
      success: true,
      message: "CertificateAuthority is successfully updated.",
    });
  } catch (error) {
    console.error("CertificateAuthority update error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Updating certificateAuthority
 * @returns {json} retrun a JSON object
 */
 module.exports.ChangeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id; // From header

    // Retriving a certificateAuthority based on certificateAuthority id and userid
    const certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, userId: userid, status: {$ne: status} });

    if (!certificateAuthority) {
      return res.json({
        error: true,
        status: 400,
        message: "No certificateAuthority is found for changing status."
      });
    }

    // Updating status 
    certificateAuthority.status = status;
    await certificateAuthority.save(); // Saving into DB

    return res.status(200).json({
      success: true,
      message: "Status is successfully updated.",
    });
  } catch (error) {
    console.error("Status update error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting all my certificateAuthority subjects
 * @returns {json} retrun a JSON object
 */
 module.exports.MyCertificateAuthoritySubjects = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 

    // Retriving all certificateAuthoritys based on userid
    let certificateAuthoritySubjects = await CertificateAuthority.Model.find({ userId: userid }, { id: 1, subject: 1, status: 1, isOwner: { $toBool: true }, _id: 0 });

    return res.status(200).json({
      success: true,
      certificateAuthoritySubjects,
      message: "My certificateAuthority subjects are successfully retrieved.",
    });
  } catch (error) {
    console.error("My certificateAuthoritys error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting all certificateAuthority subjects not posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.OtherCertificateAuthoritySubjects = async (req, res) => {
  try {    
    const userid = req.headers.userid; // From header

    // Retriving all certificateAuthoritys based on userid
    let otherCertificateAuthoritySubjects = await CertificateAuthority.Model.find({ userId: {$ne: userid}, status: 'Published' }, { id: 1, subject: 1, status: 1, isOwner: { $toBool: false }, _id: 0 });

    return res.status(200).json({
      success: true,
      otherCertificateAuthoritySubjects: otherCertificateAuthoritySubjects,
      message: "Other certificateAuthority subjects are successfully retrieved.",
    });
  } catch (error) {
    console.error("CertificateAuthoritys error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting a certificateAuthority posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.MyCertificateAuthority = async (req, res) => {
  try {    
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id; // From header
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "CertificateAuthority id is not provided."
      });
    }
    
    // Retriving a certificateAuthority based on certificateAuthority id and userid
    // Using lean to decode image as base64
    const certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, userId : userid }, { _id: 0, __v: 0, bookCover: { _id: 0, updatedAt: 0 }}).lean();

    if (!certificateAuthority) {
      return res.json({
        error: true,
        status: 400,
        message: "No my certificateAuthority is found."
      });
    }

    return res.status(200).json({
      success: true,
      certificateAuthority,
      message: "My certificateAuthority is successfully retrieved.",
    });
  } catch (error) {
    console.error("My certificateAuthority error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

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
    const certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, status: "Published" }, { _id: 0, __v: 0, bookCover: { _id: 0, updatedAt: 0 }}).lean();

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

/**
 * Delete a certificateAuthority posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.DeleteCA = async (req, res) => {
  try {    
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "CertificateAuthority id is not provided."
      });
    }

    // Retriving a certificateAuthority based on certificateAuthority id and userid
    let certificateAuthority = await CertificateAuthority.Model.findOne({ id: id, userId : userid });

    if (!certificateAuthority) {
      return res.json({
        error: true,
        status: 400,
        message: "No certificateAuthority to be deleted is found."
      });
    }

    certificateAuthority.deleteOne(function(err) {
      if (err) {
        return res.status(500).json({
          error: true,
          message: err.message,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "CertificateAuthority is successfully deleted.",
        });
      }
    });
  } catch (error) {
    console.error("Deleting certificateAuthority error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};