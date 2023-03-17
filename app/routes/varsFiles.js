const express = require("express");
const router = express.Router();

const { verifyJwt } = require("../middlewares/verifyJwt");
const varsFile = require("../controllers/varsFile");

router.post("/create", verifyJwt, varsFile.Create);
router.post('/update', verifyJwt, varsFile.Update);
router.delete("/delete", verifyJwt, varsFile.Delete);
router.get("/varsFile", verifyJwt, varsFile.VarsFile);
router.get("/issuers", verifyJwt, varsFile.Issuers);
router.get("/varsFiles", verifyJwt, varsFile.VarsFiles);

module.exports = router;