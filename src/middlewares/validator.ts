import Joi from "joi";

export const addUserValidator = Joi.object({
  name: Joi.string().required().min(5).max(60),
  email: Joi.string()
    .required()
    .min(5)
    .max(60)
    .email({ tlds: { allow: ["com", "net"] } }),
  password: Joi.string().required().min(8),
});

export const updateUserValidator = Joi.object({
  name: Joi.string().required().min(5).max(60),
  email: Joi.string()
    .required()
    .min(5)
    .max(60)
    .email({ tlds: { allow: ["com", "net"] } }),
});

export const signInValidator = Joi.object({
  email: Joi.string()
    .required()
    .min(5)
    .max(60)
    .email({ tlds: { allow: ["com", "net"] } }),
  password: Joi.string().required().min(8),
});

export const nameValidator = Joi.object({
  name: Joi.string().required().min(5).max(60),
});

export const credentialValidator = Joi.object({
  subjectDid: Joi.string().required().min(3),
  image: Joi.string().required().min(3),
  visaType: Joi.string().required(),
  visaID: Joi.string().required().min(5).max(60),
  firstName: Joi.string().required().min(3).max(60),
  middleName: Joi.string().required().min(3).max(60),
  lastName: Joi.string().required().min(3).max(60),
  dateOfBirth: Joi.string().required(),
  nationality: Joi.string().required(),
  passportNumber: Joi.string().required(),
  passportExpiryDate: Joi.string().required(),
  gender: Joi.string().required(),
  placeOfBirth: Joi.string().required(),
});

export const applicantValidator = Joi.object({
  did: Joi.string().required().min(3),
  firstname: Joi.string().required().min(3).max(60),
  lastname: Joi.string().required().min(3).max(60),
  middlename: Joi.string().required().min(3).max(60),
  image: Joi.string().required().min(3),
  publickey: Joi.string().required().min(3),
});

export const transactionHashValidator = Joi.object({
  txh: Joi.string().required().min(3),
});
