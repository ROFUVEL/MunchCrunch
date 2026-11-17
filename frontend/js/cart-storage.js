function getCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart === null) return [];

  try {
    const cart = JSON.parse(savedCart);
    const isValid = Array.isArray(cart) && cart.every(item =>
      item && Number.isInteger(item.dishId) && item.dishId > 0 &&
      typeof item.name === 'string' &&
      Number.isInteger(item.quantity) && item.quantity > 0 &&
      (typeof item.price === 'number' || typeof item.price === 'string') &&
      String(item.price).trim() !== '' &&
      Number.isFinite(Number(item.price)) && Number(item.price) >= 0
    );
    if (!isValid) throw new Error('Некорректная корзина');
    return cart;
  } catch (e) {
    localStorage.removeItem('cart');
    showNotice('Сохранённая корзина повреждена и была очищена. Добавьте блюда заново.', 'error');
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}
