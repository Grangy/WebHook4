// src/utils/middleware.js
const Lead = require('../models/Lead');

async function fillGiftUseField() {
  try {
    const leadsToUpdate = await Lead.find({ callerphone: { $exists: true }, subject: "Колесо фортуны" });
    for (const lead of leadsToUpdate) {
      lead.giftUse = true;
      await lead.save();
    }
    console.log('Field "giftUse" updated for existing leads');
  } catch (error) {
    console.error('Error updating "giftUse" field:', error.message);
  }
}

module.exports = { fillGiftUseField };
