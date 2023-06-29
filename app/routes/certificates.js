const express = require("express");
const router = express.Router();

const { verifyJwt } = require("../middlewares/verifyJwt");
const certificate = require("../controllers/certificate");

router.get("/certificates", verifyJwt, certificate.Certificates);
router.head("/initPKI", verifyJwt, certificate.InitPKI);
router.head("/generateCA", verifyJwt, certificate.GenerateCA);
router.head('/generateDH', verifyJwt, certificate.GenerateDH);
router.head("/generateTA", verifyJwt, certificate.GenerateTA);
router.head("/generateCertificate", verifyJwt, certificate.GenerateCertificate);

module.exports = router;