// src/models/Lead.js
const express = require('express');
const { createLeadHandler, getLeadsHandler, deleteLeadHandler } = require('../controllers/leadController');
const router = express.Router();

router.post('/', createLeadHandler);
router.get('/', getLeadsHandler);
router.delete('/:id', deleteLeadHandler);

module.exports = router;
