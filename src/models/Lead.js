const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadtype: String,
  callphase: String,
  siteName: String,
  device: String,
  os: String,
  url: String,
  ref: String,
  city: String,
  source: String,
  medium: String,
  subject: String,
  fio: String,
  callerphone: String,
  requestDate: { type: String, default: getCurrentDate },
  redirectNumber: String,
  status: String,
  sessionId: String,
  yaClientId: String,
  giftUse: { type: Boolean, default: false },
  callback_custom_fields: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  requestDateTime: Date,
  requestAdditionalField: String,
});

function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
