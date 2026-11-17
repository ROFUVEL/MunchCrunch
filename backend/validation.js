function isValidPhone(phone) {
  return typeof phone === 'string' && /^\d{10,11}$/.test(phone);
}

module.exports = { isValidPhone };
