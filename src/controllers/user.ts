import { NextFunction, Request, Response } from "express";
import {
  addUserValidator,
  signInValidator,
  nameValidator,
} from "../middlewares/validator";
import jwt from "jsonwebtoken";
import db from "../dbConfig";
import bcrypt from "bcrypt";
import { crypto_random_pass_key } from "../utils/randomHex";
import { randomUUID } from "crypto";
import { privateKey, publicKey } from "../utils/generateKeys";

export const addIssuer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name } = req.body;

  try {
    const { error, value } = nameValidator.validate({
      name,
    });

    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
    }

    const did = `did:dev:${crypto_random_pass_key()}`;
    const id = randomUUID();
    const keys = JSON.stringify({
      privateKey: privateKey,
      publicKey: publicKey,
    });
    const insertIssuerQuery = `INSERT INTO immigration (id, name, did, keys) VALUES ($1, $2, $3, $4) RETURNING *`;
    const insertIssuer = await db.query(insertIssuerQuery, [
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
  } catch (error) {
    next(error);
  }
};

export const addUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  try {
    const { error, value } = addUserValidator.validate({
      name,
      email,
      password,
    });

    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
    }

    const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;

    const doesEmailExist = await db.query(checkEmailQuery, [email]);

    if (doesEmailExist.rows.length > 0) {
      res.status(400).json({ status: "failed", msg: "email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const findimmigrationIdQuery = `SELECT id FROM immigration LIMIT 1`;
    const findImmigrationResult = (await db.query(findimmigrationIdQuery))
      .rows[0].id;

    const insertUserQuery = `INSERT INTO users (name, email, password, immigrationId) VALUES ($1, $2, $3, $4) RETURNING *`;
    const insertUser = await db.query(insertUserQuery, [
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
  } catch (error) {
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signInValidator.validate({
      email,
      password,
    });

    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
    }

    const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;

    const doesEmailExist = await db.query(checkEmailQuery, [email]);

    if (doesEmailExist.rows.length === 0) {
      res
        .status(400)
        .json({ status: "failed", msg: "invalid email or password" });
    }

    const user = doesEmailExist.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res
        .status(401)
        .json({ status: "failed", msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

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
  } catch (error) {
    next(error);
  }
};
