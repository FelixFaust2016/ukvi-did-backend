"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.addUser = exports.addIssuer = void 0;
const validator_1 = require("../middlewares/validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dbConfig_1 = __importDefault(require("../dbConfig"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const randomHex_1 = require("../utils/randomHex");
const crypto_1 = require("crypto");
const generateKeys_1 = require("../utils/generateKeys");
const addIssuer = async (req, res, next) => {
    const { name } = req.body;
    try {
        const { error, value } = validator_1.nameValidator.validate({
            name,
        });
        if (error) {
            res.status(400).json({ status: "failed", msg: error.details[0].message });
        }
        const did = `did:dev:${(0, randomHex_1.crypto_random_pass_key)()}`;
        const id = (0, crypto_1.randomUUID)();
        const keys = JSON.stringify({
            privateKey: generateKeys_1.privateKey,
            publicKey: generateKeys_1.publicKey,
        });
        const insertIssuerQuery = `INSERT INTO immigration (id, name, did, keys) VALUES ($1, $2, $3, $4) RETURNING *`;
        const insertIssuer = await dbConfig_1.default.query(insertIssuerQuery, [
            id,
            name,
            did,
            keys,
        ]);
        const newIssuer = insertIssuer.rows[0];
        res.status(201).json({
            status: "success",
            msg: "Issuer created successfully",
            issuer: newIssuer,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addIssuer = addIssuer;
const addUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        const { error, value } = validator_1.addUserValidator.validate({
            name,
            email,
            password,
        });
        if (error) {
            res.status(400).json({ status: "failed", msg: error.details[0].message });
        }
        const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
        const doesEmailExist = await dbConfig_1.default.query(checkEmailQuery, [email]);
        if (doesEmailExist.rows.length > 0) {
            res.status(400).json({ status: "failed", msg: "email already exists" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const findimmigrationIdQuery = `SELECT id FROM immigration LIMIT 1`;
        const findImmigrationResult = (await dbConfig_1.default.query(findimmigrationIdQuery))
            .rows[0].id;
        const insertUserQuery = `INSERT INTO users (name, email, password, immigrationId) VALUES ($1, $2, $3, $4) RETURNING *`;
        const insertUser = await dbConfig_1.default.query(insertUserQuery, [
            name,
            email,
            hashedPassword,
            findImmigrationResult,
        ]);
        const newUser = insertUser.rows[0];
        res.status(201).json({
            status: "success",
            msg: "User created successfully",
            user: newUser,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addUser = addUser;
const signIn = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const { error, value } = validator_1.signInValidator.validate({
            email,
            password,
        });
        if (error) {
            res.status(400).json({ status: "failed", msg: error.details[0].message });
        }
        const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
        const doesEmailExist = await dbConfig_1.default.query(checkEmailQuery, [email]);
        if (doesEmailExist.rows.length === 0) {
            res
                .status(400)
                .json({ status: "failed", msg: "invalid email or password" });
        }
        const user = doesEmailExist.rows[0];
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            res
                .status(401)
                .json({ status: "failed", msg: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "8h" });
        res.status(200).json({
            status: "success",
            msg: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.signIn = signIn;
