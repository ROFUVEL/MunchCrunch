# MunchCrunch

MunchCrunch — веб-приложение для оформления заказов в сети ресторанов.

Система позволяет клиентам просматривать меню, выбирать ресторан, оформлять заказы и отслеживать их статус.

## Основные возможности

### Клиент

* Авторизация по номеру телефона и коду подтверждения;
* Выбор точки обслуживания;
* Просмотр меню ресторана;
* Добавление блюд в корзину;
* Оформление заказа;
* Просмотр истории и статусов заказов;
* Просмотр профиля.

## Используемые технологии

### Backend

* Node.js
* Express.js
* PostgreSQL

### Frontend

* HTML
* CSS
* JavaScript (Vanilla JS)

## Структура проекта

```text
MunchCrunch/
├── backend/
│   ├── adapters/
│   ├── facades/
│   ├── tests/
│   ├── db.js
│   └── server.js
│
├── frontend/
│   ├── html/
│   ├── js/
│   └── styles/
│
└── database.sql
```

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/ROFUVEL/MunchCrunch.git
cd MunchCrunch
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

1. Установить PostgreSQL.
2. Создать новую базу данных.
3. Выполнить SQL-скрипт создания структуры и начальных данных.

### 4. Настройка подключения

В файле `backend/db.js` указать параметры подключения к PostgreSQL:

* host
* port
* database
* user
* password

### 5. Запуск приложения

```bash
node backend/server.js
```

или

```bash
npm start
```

## База данных

Основные таблицы системы:

* users
* branches
* categories
* dishes
* branch_dishes
* orders
* order_items
* auth_codes
* sessions


Приложение содержит только клиентский интерфейс и API. Статусы заказов отображаются из базы данных; управление меню и обработка заказов в приложение не входят.
