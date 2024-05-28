const Lead = require('../models/Lead');
const { sendTo1CServer, sendToTelegram } = require('./telegramService');

async function createLead(leadData) {
  const newLead = new Lead(leadData);

  if (newLead.subject === 'Колесо фортуны') {
    const existingLeads = await Lead.find({ callerphone: newLead.callerphone, subject: 'Колесо фортуны' });
    const fortuneUsed = existingLeads.some(lead => lead.giftUse);

    if (!fortuneUsed) {
      await sendTo1CServer(newLead);
    }

    newLead.giftUse = true;
  } else {
    await sendTo1CServer(newLead);
  }

  await newLead.save();
  await sendToTelegram(newLead);

  return newLead;
}

async function getLeads() {
  return await Lead.find();
}

async function deleteLead(leadId) {
  return await Lead.findByIdAndDelete(leadId);
}

module.exports = {
  createLead,
  getLeads,
  deleteLead
};
