-- PostgreSQL. Run against a NEW, empty database.
-- This script does not drop existing tables or data. No sessions table is used.
BEGIN;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role = 'client'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    working_hours VARCHAR(100) NOT NULL
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    image_url TEXT
);

CREATE TABLE branch_dishes (
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    dish_id INTEGER NOT NULL REFERENCES dishes(id),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    price_override NUMERIC(10, 2) CHECK (price_override >= 0),
    PRIMARY KEY (branch_id, dish_id)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'cooking', 'ready', 'issued', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER NOT NULL REFERENCES dishes(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE auth_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL REFERENCES users(phone),
    code VARCHAR(4) NOT NULL CHECK (code ~ '^[0-9]{4}$'),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX auth_codes_phone_created_idx ON auth_codes(phone, created_at DESC);

INSERT INTO users (phone) VALUES
    ('79999999999'),
    ('78888888888'),
    ('78908908989');

INSERT INTO branches (name, address, working_hours) VALUES
    ('MunchCrunch — Центр', 'Красноярск, проспект Мира, 10', 'Ежедневно 10:00–22:00'),
    ('MunchCrunch — Взлётка', 'Красноярск, улица Весны, 5', 'Ежедневно 09:00–23:00'),
    ('MunchCrunch — Академгородок', 'Красноярск, Академгородок, 15', 'Ежедневно 11:00–21:00');

INSERT INTO categories (name) VALUES
    ('Бургеры'), ('Закуски'), ('Напитки'), ('Десерты');

INSERT INTO dishes (name, description, price, category_id) VALUES
    ('Классический бургер', 'Говяжья котлета, салат, томат и фирменный соус.', 290, 1),
    ('Чизбургер', 'Говяжья котлета, сыр чеддер, огурцы и соус.', 330, 1),
    ('Чикенбургер', 'Хрустящая курица, салат и сливочный соус.', 270, 1),
    ('Картофель фри', 'Золотистый картофель с солью, порция 150 г.', 150, 2),
    ('Наггетсы', 'Шесть кусочков куриного филе в панировке.', 210, 2),
    ('Луковые кольца', 'Хрустящие луковые кольца, порция 120 г.', 180, 2),
    ('Лимонад', 'Домашний лимонад с лимоном и мятой, 400 мл.', 140, 3),
    ('Американо', 'Чёрный кофе, 250 мл.', 120, 3),
    ('Чай', 'Чёрный чай, 300 мл.', 90, 3),
    ('Чизкейк', 'Классический сливочный чизкейк.', 230, 4),
    ('Брауни', 'Шоколадный десерт с насыщенным вкусом какао.', 190, 4),
    ('Мороженое', 'Ванильное мороженое, 100 г.', 110, 4);

-- Seed branches use base prices; price_override can set a branch-specific price.
INSERT INTO branch_dishes (branch_id, dish_id, is_available)
SELECT b.id, d.id,
       NOT ((b.id = 2 AND d.id = 10) OR (b.id = 3 AND d.id IN (6, 12)))
FROM branches b CROSS JOIN dishes d;

INSERT INTO orders (user_id, branch_id, total_price, status, created_at, updated_at) VALUES
    (1, 1, 580, 'created', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
    (1, 2, 480, 'cooking', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '15 minutes'),
    (1, 1, 500, 'ready', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '5 minutes'),
    (1, 3, 520, 'issued', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
    (1, 1, 290, 'cancelled', NOW() - INTERVAL '2 days', NOW() - INTERVAL '47 hours'),
    (2, 2, 600, 'issued', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours');

INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES
    (1, 1, 1, 290), (1, 4, 1, 150), (1, 7, 1, 140),
    (2, 2, 1, 330), (2, 4, 1, 150),
    (3, 3, 1, 270), (3, 10, 1, 230),
    (4, 1, 1, 290), (4, 7, 1, 140), (4, 9, 1, 90),
    (5, 1, 1, 290),
    (6, 4, 2, 150), (6, 5, 1, 210), (6, 9, 1, 90);

-- Codes are generated by POST /api/login; no expiring seed codes are needed.
-- Fail the entire transaction if a seeded order total is inconsistent.
DO $$
BEGIN
    IF EXISTS (
        SELECT o.id FROM orders o
        LEFT JOIN order_items i ON i.order_id = o.id
        GROUP BY o.id, o.total_price
        HAVING o.total_price <> COALESCE(SUM(i.quantity * i.price), 0)
    ) THEN
        RAISE EXCEPTION 'Order totals do not match order items';
    END IF;
END;
$$;

COMMIT;
