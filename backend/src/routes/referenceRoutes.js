
const express = require('express');
const referenceController = require('../controllers/referenceController');

const router = express.Router();

router.get('/areas', referenceController.getAreas);
router.get('/categories', referenceController.getCategories);
router.get('/statuses', referenceController.getStatuses);

module.exports = router;
