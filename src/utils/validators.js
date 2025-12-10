function isValidPhoneNumber(phone) {
  // Basic E.164-ish check: starts with + and digits, length 8..15
  return /^\+\d{8,15}$/.test(phone);
}

function parseFutureDate(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() <= Date.now()) return null;
  return d;
}

module.exports = { isValidPhoneNumber, parseFutureDate };
