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
  }
);

const Model = mongoose.model("issuer", issuerSchema);

module.exports = { Countries, issuerSchema, Model };