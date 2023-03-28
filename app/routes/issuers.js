const express = require("express");
const router = express.Router();

const { verifyJwt } = require("../middlewares/verifyJwt");
const issuer = require("../controllers/issuer");

router.get("/issuers", verifyJwt, issuer.Issuers);

module.exports = router;