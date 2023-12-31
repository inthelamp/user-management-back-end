const bcrypt = require('bcryptjs');
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * User statuses
 * @enum {string}
 */
const Statuses = {
	ACTIVE: "Active",
	INACTIVE: "Inactive",
	SUSPENDED: "Suspended"
};

/**
 * User roles
 * @enum {string}
 */
const Roles = {
	ADMIN: "Admin",
	USER: "User"
};


// User schema
const userSchema = new Schema(
  { 
    id: { type: String, unique: true, required: true },
    email: { type: String,  unique: true, required: true },
    name: { type: String },
    birthday: { type: Date },
    status: {
      type: String,
      default: Statuses.INACTIVE,
      enum: Statuses
    },  
    role: {
      type: String,
      default: Roles.USER,
      enum: Roles,
      required: true
    },     
    password: { type: String, required: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    emailToken: { type: String, default: null },
    emailTokenExpires: { type: Date, default: null },    
    accessToken: { type: String, default: null },
    tokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const Model = mongoose.model("user", userSchema);

module.exports = { Statuses, Roles, Model };

/**
 * Getting hash
 * @param {string} inputPassword - input password 
 * @returns {string} hashed password 
 */
module.exports.hashPassword = async (inputPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await new Promise((resolve, reject) => {
      bcrypt.hash(inputPassword, salt, function(err, hash) {
        if (err) {
          reject(err)
        }
        resolve(hash)
      });
    });
    
    return hash;
  } catch (error) {
    throw new Error("Hashing process is failed.", error);
  }
};

/**
 * Verifying password with hash
 * @param {string} inputPassword - input password
 * @param {string}} hashedPassword - hashed password
 * @returns {boolean} showing if it is valid or not
 */
module.exports.verifyPassword = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    throw new Error("Verification process is failed.", error);
  }
};