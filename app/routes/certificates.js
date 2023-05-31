const express = require("express");
const router = express.Router();

const { verifyJwt } = require("../middlewares/verifyJwt");
const certificate = require("../controllers/certificate");

router.head("/initPKI", verifyJwt, certificate.InitPKI);
router.head("/generateCA", verifyJwt, certificate.GenerateCA);
router.head('/generateDH', verifyJwt, certificate.GenerateDH);
router.head("/generateServer", verifyJwt, certificate.GenerateServer);
router.head("/generateTA", verifyJwt, certificate.GenerateTA);
router.head("/generateClient", verifyJwt, certificate.GenerateClient);

module.exports = router;