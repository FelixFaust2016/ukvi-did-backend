"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const pg_1 = require("pg");
// const isProduction = process.env.NODE_ENV === "production";
// const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});
pool
    .connect()
    .then((client) => {
    console.log("Connected to PostgreSQL successfully");
    client.release(); // Release the connection back to the pool
})
    .catch((err) => console.error("Connection error", err.stack));
exports.default = pool;
