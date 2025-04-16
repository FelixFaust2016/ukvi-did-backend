import { NextFunction, Request, Response } from "express";
import { applicantValidator } from "../middlewares/validator";
import db from "../dbConfig";

export const addApplicant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { did, firstname, lastname, middlename, image, publickey } = req.body;
  try {
    const { error, value } = applicantValidator.validate({
      did,
      firstname,
      lastname,
      middlename,
      image,
      publickey,
    });

    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
    }

    const checkDidQuery = `SELECT * FROM applicants WHERE did = $1`;

    const doesDIDExist = await db.query(checkDidQuery, [did]);

    if (doesDIDExist.rows.length > 0) {
      res.status(400).json({ status: "failed", msg: "did already exists" });
    }

    const insterApplicantQuery = `INSERT INTO users (did,
      firstname,
      lastname,
      middlename,
      image,
      publickey) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const insertApplicant = await db.query(insterApplicantQuery, [
      did,
      firstname,
      lastname,
      middlename,
      image,
      publickey,
    ]);

    const newApplicant = insertApplicant.rows[0];

    res.status(201).json({
      status: "success",
      msg: "User created successfully",
      user: newApplicant,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteApplicant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;

  try {
    const deleteQuery = `DELETE FROM users WHERE id = $1 RETURNING *`;

    const deleteQueryResult = await db.query(deleteQuery, [id]);

    if (deleteQueryResult.rows.length === 0) {
      return res
        .status(400)
        .json({ status: "failed", msg: "This applicant does not exist" });
    }

    return res
      .status(200)
      .json({ msg: "Deleted Successfully", data: deleteQueryResult.rows[0] });
  } catch (error) {
    next(error);
  }
};
