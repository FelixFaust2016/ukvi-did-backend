"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto_random_pass_key = void 0;
const crypto_1 = __importDefault(require("crypto"));
const crypto_random_pass_key = () => {
    const random_pass = crypto_1.default.randomBytes(16).toString("hex");
    return random_pass;
};
exports.crypto_random_pass_key = crypto_random_pass_key;
