// src/controllers/leadController.js
const { createLead, getLeads, deleteLead } = require('../services/leadService');

async function createLeadHandler(req, res) {
  try {
    const newLead = await createLead(req.body);
    res.status(200).json({ message: 'OK', data: newLead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function getLeadsHandler(req, res) {
  try {
    const leads = await getLeads();
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function deleteLeadHandler(req, res) {
  try {
    const leadId = req.params.id;
    await deleteLead(leadId);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = {
  createLeadHandler,
  getLeadsHandler,
  deleteLeadHandler
};
