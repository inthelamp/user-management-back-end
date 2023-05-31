const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * Issuer countries
 * @enum {string}
 */
const Categories = {
    CA: "CA", 
    Server: "Server", 
    Clients: "Clients"
};

// Issuer schema
const certificateSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    varsFileId: { type: String, required: true },
    commonName: { type: String, unique: true, required: true },     //Its vars file common name is attached behind to create unique common name
    category: {
        type: String,
        default: Categories.CA,
        enum: Categories,
        required: true
    },
  },
  { timestamps: true }
);

const Model = mongoose.model("certificate", certificateSchema);

module.exports = { Categories, Model };