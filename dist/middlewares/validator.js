"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialValidator = exports.nameValidator = exports.signInValidator = exports.addUserValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.addUserValidator = joi_1.default.object({
    name: joi_1.default.string().required().min(5).max(60),
    email: joi_1.default.string()
        .required()
        .min(5)
        .max(60)
        .email({ tlds: { allow: ["com", "net"] } }),
    password: joi_1.default.string().required().min(8),
});
exports.signInValidator = joi_1.default.object({
    email: joi_1.default.string()
        .required()
        .min(5)
        .max(60)
        .email({ tlds: { allow: ["com", "net"] } }),
    password: joi_1.default.string().required().min(8),
});
exports.nameValidator = joi_1.default.object({
    name: joi_1.default.string().required().min(5).max(60),
});
exports.credentialValidator = joi_1.default.object({
    visaID: joi_1.default.string().required().min(5).max(60),
    firstName: joi_1.default.string().required().min(3).max(60),
    lastName: joi_1.default.string().required().min(3).max(60),
    dateOfBirth: joi_1.default.string().required(),
    nationality: joi_1.default.string().required(),
    passportNumber: joi_1.default.string().required(),
    passportExpiryDate: joi_1.default.string().required(),
    gender: joi_1.default.string().required(),
    placeOfBirth: joi_1.default.string().required(),
});
