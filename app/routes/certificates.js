const express = require("express");
const router = express.Router();
const multer  = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

const { verifyJwt } = require("../middlewares/verifyJwt");
const certificate = require("../controllers/certificate");

router.post("/create", verifyJwt, upload.single('certificate'), certificate.Create);
// router.patch('/update', verifyJwt, function (req, res) {
//     review.Update(req, res);
// });
router.post('/update', verifyJwt, certificate.Update);
router.delete("/delete", verifyJwt,  certificate.Delete);
router.get("/certificate/:id", function (req, res) {
    certificate.Certificate(req, res);
});

module.exports = router;