const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * Issuer countries
 * @enum {string}
 */
const Countries = {
    CA: "CA",
    US: "US"
};

/**
 * Issuer statuses
 * @enum {string}
 */
const Statuses = {
  Created_Vars: "Created_Vars",     //Vars file is created
  Initialized_PKI: "Initialized_PKI", //Performed init-pki
  Generated_CA: "Generated_CA",         //Certificate Authority is generated 
  Generated_DH: "Generated_DH",         //DH is generated
  Generated_Server: "Generated_Server", //Server certificate is generated
  Generated_TA: "Generated_TA", //Server certificate is generated
  Generated_Client: "Generated_Client", //At least a client certificate is generated
};

// Issuer schema
const issuerSchema = new Schema(
  {
    country: {
      type: String,
      default: Countries.CA,
      enum: Countries,
      required: true
    }, 
    province: { type: String, required: true }, 
    city: { type: String, required: true }, 
    organization: { type: String, required: true }, 
    email: { type: String, required: true }, 
    organizationalUnit: { type: String, required: true },
    commonName: { type: String, unique: true, required: true }, 
    status: {
      type: String,
      default: Statuses.Created_Vars,
      enum: Statuses,
      required: true
    }, 
  }
);

const Model = mongoose.model("issuer", issuerSchema);

module.exports = { Countries, Statuses, issuerSchema, Model };