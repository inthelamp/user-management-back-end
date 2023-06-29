const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * Issuer countries
 * @enum {string}
 */
const Categories = {
    CA: "CA", 
    Server: "Server", 
    Client: "Client"
};

// Issuer schema
const certificateSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    commonName: { type: String, required: true },     //CA, client, or server's name to make fully qualified name in all
    category: {
        type: String,
        default: Categories.CA,
        enum: Categories,
        required: true
    },
    varsFileId: { type: String, required: true },
    deviceId: { type: String },
  },
  { timestamps: true }
);

const Model = mongoose.model("certificate", certificateSchema);

module.exports = { Categories, Model };