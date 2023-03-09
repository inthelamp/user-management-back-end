const express = require("express");
const router = express.Router();
const multer  = require('multer');

const storage = multer.memoryStorage()
const certificateAuthorities = multer({ storage: storage });

const { verifyJwt } = require("../middlewares/verifyJwt");
const certificateAuthority = require("../controllers/certificateAuthority");

router.post("/create", verifyJwt, certificateAuthorities.single('certificateAuthority'), certificateAuthority.Create);
// router.patch('/update', verifyJwt, function (req, res) {
//     review.Update(req, res);
// });
router.post('/update', verifyJwt, certificateAuthority.Update);
router.delete("/delete", verifyJwt,  certificateAuthority.Delete);
router.get("/certificateAuthorities/:id", function (req, res) {
    certificateAuthority.CertificateAuthority(req, res);
});

module.exports = router;