"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCredential = exports.issueCredential = void 0;
const validator_1 = require("../middlewares/validator");
const signwithHSM_1 = require("../utils/signwithHSM");
const dbConfig_1 = __importDefault(require("../dbConfig"));
const vcBuilder_1 = require("../utils/vcBuilder");
const verifyHSM_1 = require("../utils/verifyHSM");
const issueCredential = async (req, res, next) => {
    const { visaID, firstName, lastName, dateOfBirth, nationality, passportNumber, passportExpiryDate, gender, placeOfBirth, } = req.body;
    try {
        const { error, value } = validator_1.credentialValidator.validate({
            visaID,
            firstName,
            lastName,
            dateOfBirth,
            nationality,
            passportNumber,
            passportExpiryDate,
            gender,
            placeOfBirth,
        });
        if (error) {
            res.status(400).json({ status: "failed", msg: error.details[0].message });
        }
        const getPrivateKeyQuery = `SELECT keys FROM immigration`;
        const getPrivateKeyResult = await dbConfig_1.default.query(getPrivateKeyQuery);
        const keys = getPrivateKeyResult.rows[0].keys;
        const privatekey = keys.privateKey;
        const publicKey = keys.publicKey;
        const serviceEndpoint = process.env.UKVI_ENDPOINT || `http://api.ukvi.com`;
        const { signature, credentialJWT } = (0, signwithHSM_1.signWithHSM)(privatekey, req.body);
        const verifiableCredential = (0, vcBuilder_1.vcBuilder)(publicKey, Object.keys(req.body), serviceEndpoint, req.body, signature);
        res.status(200).json({
            status: "success",
            msg: "Credential signed successfully",
            data: { vc: verifiableCredential, jwt: credentialJWT },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.issueCredential = issueCredential;
const verifyCredential = (req, res) => {
    const { credentialJWT, vc } = req.body;
    try {
        const publicKey = vc.publicKey;
        const isValidCredential = (0, verifyHSM_1.verifyCredentialJWT)(publicKey, credentialJWT);
        if (!isValidCredential) {
            res.status(400).json({ status: "failed", msg: "Credential is invalid" });
        }
        res.status(200).json({
            status: "success",
            msg: "Credential verified successfully",
        });
    }
    catch (error) {
        res.status(500).json({ status: "failed", msg: "Credential is invalid" });
    }
};
exports.verifyCredential = verifyCredential;
