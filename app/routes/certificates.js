const express = require("express");
const router = express.Router();

const { verifyJwt } = require("../middlewares/verifyJwt");
const certificate = require("../controllers/certificate");

router.post("/createCA", verifyJwt, certificate.CreateCA);
router.post('/updateCA', verifyJwt, certificate.UpdateCA);
router.delete("/deleteCA", verifyJwt,  certificate.DeleteCA);

module.exports = router;