function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function sendApiError(error, res) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в запросе' });
  }
  if (error.status === 400) {
    return res.status(400).json({ error: error.message });
  }
  // Нарушение внешнего ключа: например, удалён пользователь или ресторан.
  if (error.code === '23503') {
    return res.status(400).json({ error: 'Указанный пользователь, ресторан или блюдо больше не существует' });
  }
  console.error('API error:', error);
  return res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' });
}

module.exports = { badRequest, sendApiError };
