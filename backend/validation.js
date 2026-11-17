function isValidPhone(phone) {
  return typeof phone === 'string' && /^\d{10,11}$/.test(phone);
}

function isPositiveInteger(value) {
  // В БД идентификаторы и количество хранятся в столбцах INTEGER.
  return Number.isInteger(value) && value > 0 && value <= 2147483647;
}

function parseId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
}

function isValidOrderItems(items) {
  return Array.isArray(items) && items.length > 0 && items.every(item =>
    item && isPositiveInteger(item.dishId) && isPositiveInteger(item.quantity)
  );
}

module.exports = { isValidPhone, isPositiveInteger, parseId, isValidOrderItems };
