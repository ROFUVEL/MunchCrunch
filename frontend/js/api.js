const API_URL = "http://localhost:3000/api";

async function getMenu() {
  const res = await fetch(`${API_URL}/menu`);
  return res.json();
}

async function getBranches() {
  const res = await fetch(`${API_URL}/branches`);
  return res.json();
}

async function createOrder(data) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return res.json();
}