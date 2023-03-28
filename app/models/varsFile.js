const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const { Countries, issuerSchema } = require("../models/issuer");

/**
 * Vars file algorithms
 * @enum {string}
 */
const Algorithms = {
    rsa: "rsa", 
    ec: "ec"
};

/**
 * Vars file curves
 * @enum {string}
 */
const Curves = {
    secp112r1: "secp112r1",
    secp112r2: "secp112r2",
    secp128r1: "secp128r1",
    secp128r2: "secp128r2",
    secp160k1: "secp160k1",
    secp160r1: "secp160r1",
    secp160r2: "secp160r2",
    secp192k1: "secp192k1",
    secp224k1: "secp224k1",
    secp224r1: "secp224r1",
    secp256k1: "secp256k1",
    secp384r1: "secp384r1",
    secp521r1: "secp521r1",
    prime192v1: "prime192v1",
    prime192v2: "prime192v2",
    prime192v3: "prime192v3",
    prime239v1: "prime239v1",
    prime239v2: "prime239v2",
    prime239v3: "prime239v3",
    prime256v1: "prime256v1",
    sect113r1: "sect113r1",
    sect113r2: "sect113r2",
    sect131r1: "sect131r1",
    sect131r2: "sect131r2",
    sect163k1: "sect163k1",
    sect163r1: "sect163r1",
    sect163r2: "sect163r2",
    sect193r1: "sect193r1",
    sect193r2: "sect193r2",
    sect233k1: "sect233k1",
    sect233r1: "sect233r1",
    sect239k1: "sect239k1",
    sect283k1: "sect283k1",
    sect283r1: "sect283r1",
    sect409k1: "sect409k1",
    sect409r1: "sect409r1",
    sect571k1: "sect571k1",
    sect571r1: "sect571r1",
    c2pnb163v1: "c2pnb163v1",
    c2pnb163v2: "c2pnb163v2",
    c2pnb163v3: "c2pnb163v3",
    c2pnb176v1: "c2pnb176v1",
    c2tnb191v1: "c2tnb191v1",
    c2tnb191v2: "c2tnb191v2",
    c2tnb191v3: "c2tnb191v3",
    c2pnb208w1: "c2pnb208w1",
    c2tnb239v1: "c2tnb239v1",
    c2tnb239v2: "c2tnb239v2",
    c2tnb239v3: "c2tnb239v3",
    c2pnb272w1: "c2pnb272w1",
    c2pnb304w1: "c2pnb304w1",
    c2tnb359v1: "c2tnb359v1",
    c2pnb368w1: "c2pnb368w1",
    c2tnb431r1: "c2tnb431r1",
    wap_wsg_idm_ecid_wtls1: "wap-wsg-idm-ecid-wtls1",
    wap_wsg_idm_ecid_wtls3: "wap-wsg-idm-ecid-wtls3",
    wap_wsg_idm_ecid_wtls4: "wap-wsg-idm-ecid-wtls4",
    wap_wsg_idm_ecid_wtls5: "wap-wsg-idm-ecid-wtls5",
    wap_wsg_idm_ecid_wtls6: "wap-wsg-idm-ecid-wtls6",
    wap_wsg_idm_ecid_wtls7: "wap-wsg-idm-ecid-wtls7",
    wap_wsg_idm_ecid_wtls8: "wap-wsg-idm-ecid-wtls8",
    wap_wsg_idm_ecid_wtls9: "wap-wsg-idm-ecid-wtls9",
    wap_wsg_idm_ecid_wtls10: "wap-wsg-idm-ecid-wtls10",
    wap_wsg_idm_ecid_wtls11: "wap-wsg-idm-ecid-wtls11",
    wap_wsg_idm_ecid_wtls12: "wap-wsg-idm-ecid-wtls12",
    Oakley_EC2N_3: "Oakley-EC2N-3",
    Oakley_EC2N_4: "Oakley-EC2N-4",
    brainpoolP160r1: "brainpoolP160r1",
    brainpoolP160t1: "brainpoolP160t1",
    brainpoolP192r1: "brainpoolP192r1",
    brainpoolP192t1: "brainpoolP192t1",
    brainpoolP224r1: "brainpoolP224r1",
    brainpoolP224t1: "brainpoolP224t1",
    brainpoolP256r1: "brainpoolP256r1",
    brainpoolP256t1: "brainpoolP256t1",
    brainpoolP320r1: "brainpoolP320r1",
    brainpoolP320t1: "brainpoolP320t1",
    brainpoolP384r1: "brainpoolP384r1",
    brainpoolP384t1: "brainpoolP384t1",
    brainpoolP512r1: "brainpoolP512r1",
    brainpoolP512t1: "brainpoolP512t1",
    SM2: "SM2"
};

/**
 * Vars file digests
 * @enum {string}
 */
const Digests = {
  md5: "md5", 
  sha1: "sha1", 
  sha256: "sha256", 
  sha224: "sha224", 
  sha384: "sha384", 
  sha512: "sha512"
};

// Vars file schema
const varsFileSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    userId: { type: String, index: true, required: true },
    issuer: { type: issuerSchema, required: true },
    keySize: { type: Number, default: 2048 },
    algorithm: {
      type: String,
      default: Algorithms.rsa,
      enum: Algorithms,
      required: true
    },
    curve: {
      type: String,
      default: Curves.secp521r1,
      enum: Curves,
      required: true
    },
    digest: {
      type: String,
      default: Digests.sha256,
      enum: Digests,
      required: true
    },
    caExpire: { type: Number, default: 3650 },
    certExpire: { type: Number, default: 1080 },
    certRenewDays: { type: Number, default: 30 },
    crlDays: { type: Number, default: 180 },
  },
  { timestamps: true }
);

const Model = mongoose.model("varsFile", varsFileSchema);

module.exports = { Digests, Algorithms, Curves, Model };