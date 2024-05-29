// src/services/telegramService.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const Lead = require('../models/Lead');
const moment = require('moment-timezone');
const fs = require('fs');
const { telegramBotToken, chatId } = require('../../config/config');

async function sendToTelegram(newLead) {
  if (newLead.leadtype !== 'request') {
    console.log('Lead type is not "request". Skipping Telegram notification.');
    return;
  }

  console.log('Starting spam check...');

  const twoHoursAgo = moment().subtract(2, 'hours').toDate();
  console.log(`Checking for leads since: ${twoHoursAgo}`);

  const recentLeads = await Lead.find({
    callerphone: newLead.callerphone,
    requestDate: { $gte: twoHoursAgo }
  }).exec();

  console.log(`Found ${recentLeads.length} recent leads for this phone number.`);

  if (recentLeads.length > 0) {
    console.log('Lead from this number received within last 2 hours. Skipping Telegram notification.');
    return;
  }

  try {
    const statistics = await calculateStatistics();
    const { todayCount, weekCount, monthCount, totalCount } = statistics;
    const membershipInfo = checkMembership(newLead.callerphone);
    const membershipStatus = membershipInfo.isMember ? 'Член клуба: ДА' : 'Член клуба: НЕТ';

    const statisticsMessage = `
    *Статистика:*
    Сегодня: ${todayCount} уникальных лидов
    На этой неделе: ${weekCount} уникальных лидов
    В этом месяце: ${monthCount} уникальных лидов
    Всего: ${totalCount} уникальных лидов
    `;

    let leadTypeText = '';
    if (newLead.leadtype === 'call') {
      leadTypeText = 'Новый звонок';
    } else if (newLead.leadtype === 'request') {
      leadTypeText = 'Новая заявка';
    } else {
      leadTypeText = 'Новый лид';
    }

    let leadMessage = `
    *${leadTypeText}!*
    *Имя:* ${newLead.fio}
    *Телефон:* ${newLead.callerphone}
    *Форма:* ${newLead.subject}
    *Город:* ${newLead.city}
    *Источник:* ${newLead.source}
    *Рекламная кампания:* ${newLead.medium}
    *Сайт:* ${newLead.siteName}
    ${membershipStatus}
    `;
    if (membershipInfo.isMember) {
      leadMessage += `\n*ФИО:* ${membershipInfo.name}`;
    }

    const message = `${leadMessage}\n${statisticsMessage}`;

    const bot = new TelegramBot(telegramBotToken, { polling: false });

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log('Data sent to Telegram successfully');
  } catch (error) {
    console.error('Error sending data to Telegram:', error.message);
  }
}

async function sendTo1CServer(newLead) {
  if (newLead.leadtype !== 'request') {
    console.log('Lead type is not "request". Skipping 1C server notification.');
    return;
  }

  try {
    const existingLeads = await Lead.find({ callerphone: newLead.callerphone, leadtype: 'request' });
    for (const lead of existingLeads) {
      if (lead.subject === 'Колесо фортуны' && lead.giftUse) {
        console.log('Lead has already used the gift. Skipping 1C server notification.');
        return;
      }
    }
  } catch (error) {
    console.error('Error searching for existing leads:', error.message);
    return;
  }

  const url = 'https://cloud.1c.fitness/api/hs/lead/Webhook/eeb002f9-fff0-4d2f-813d-2740c123e70e';

  let dataToSend = {
    phone: newLead.callerphone,
    name: newLead.fio,
    comment: newLead.subject,
    utm_source: newLead.source,
    utm_medium: newLead.medium,
    ym_cid: newLead.yaClientId,
    ct_cid: newLead.sessionId
  };

  if (newLead.subject === 'Колесо фортуны') {
    dataToSend.utm_source = 'gagar1n_site_fortuna';
  }

  if (Array.isArray(newLead.callback_custom_fields) && newLead.callback_custom_fields.length > 0) {
    const callbackCustomFieldsString = newLead.callback_custom_fields.map(field => `${field.name}: ${field.value}`).join(', ');
    dataToSend.comment += `\n${callbackCustomFieldsString}`;
  }

  try {
    await axios.post(url, dataToSend);
    console.log('Data sent to 1C server successfully');
  } catch (error) {
    console.error('Error sending data to 1C server:', error.message);
  }
}

async function calculateStatistics() {
  try {
    const timezone = 'Europe/Moscow';
    const today = moment.tz(timezone).startOf('day');
    const tomorrow = moment.tz(today, timezone).add(1, 'day');

    const startOfWeek = moment.tz(today, timezone).startOf('week');
    const endOfWeek = moment.tz(startOfWeek, timezone).add(1, 'week');

    const startOfMonth = moment.tz(today, timezone).startOf('month');
    const endOfMonth = moment.tz(startOfMonth, timezone).endOf('month');

    const format = date => date.format('YYYY-MM-DD');

    const leads = await Lead.find({ leadtype: 'request' }).catch(console.error);

    let todayPhones = new Set();
    let weekPhones = new Set();
    let monthPhones = new Set();
    let totalPhones = new Set();

    leads.forEach(lead => {
      if (!lead.requestDate || !lead.callerphone) {
        console.log(`Lead ${lead._id} has missing information`);
        return;
      }

      const leadDate = moment.tz(lead.requestDate, timezone);
      const formattedLeadDate = format(leadDate);

      totalPhones.add(lead.callerphone);

      if (formattedLeadDate >= format(today) && formattedLeadDate < format(tomorrow)) {
        todayPhones.add(lead.callerphone);
      }
      if (formattedLeadDate >= format(startOfWeek) && formattedLeadDate < format(endOfWeek)) {
        weekPhones.add(lead.callerphone);
      }
      if (formattedLeadDate >= format(startOfMonth) && formattedLeadDate < format(endOfMonth)) {
        monthPhones.add(lead.callerphone);
      }
    });

    console.log('Статистика:');
    console.log(`Сегодня: ${todayPhones.size} уникальных номеров`);
    console.log(`Эта неделя: ${weekPhones.size} уникальных номеров`);
    console.log(`Этот месяц: ${monthPhones.size} уникальных номеров`);
    console.log(`Всего: ${totalPhones.size} уникальных номеров`);

    return {
      todayCount: todayPhones.size,
      weekCount: weekPhones.size,
      monthCount: monthPhones.size,
      totalCount: totalPhones.size
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return { todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  }
}

function checkMembership(phoneNumber) {
  const memberships = JSON.parse(fs.readFileSync('memberships.json', 'utf8'));
  for (const member of memberships) {
    if (member.phone1 === phoneNumber || member.phone2 === phoneNumber || member.phone3 === phoneNumber || member.phone4 === phoneNumber) {
      return {
        isMember: true,
        name: member.client_name
      };
    }
  }
  return {
    isMember: false,
    name: ''
  };
}

module.exports = {
  sendToTelegram,
  sendTo1CServer,
  calculateStatistics,
  checkMembership
};
