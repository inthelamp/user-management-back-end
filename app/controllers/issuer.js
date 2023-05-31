const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { setupEasyRSA, writeToVarsFile, deleteEasyRSASetup }  = require("./shared");
const VarsFile  = require("../models/varsFile");

/**
 * Getting all issuers
 * @returns {json} retrun a JSON object
 */
module.exports.Issuers = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    
    // Retriving all reviews based on userid
    var issuers = await VarsFile.Model.find({ userId: userid }, { id: 1, issuer: 1, _id: 0 });
  
    if (!issuers) {
      return res.status(400).json({
        error: true,
        message: 'No vars settings file records are found',
      });
    }
    
    issuers = issuers.map( doc => {
      return { id: doc.id, country: doc.issuer.country, province: doc.issuer.province, city: doc.issuer.city, organization: doc.issuer.organization,
              organizationalUnit: doc.issuer.organizationalUnit, email: doc.issuer.email, commonName: doc.issuer.commonName, status: doc.issuer.status }
    });

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