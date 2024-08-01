const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

const router = new express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { code, name } = req.query;
    const result = await db.query("SELECT code, name FROM companies;");
    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code, name, description } = req.query;
    const result = await db.query(
      "SELECT code, name, description FROM companies WHERE code = $1;",
      [req.params.code]
    );

    const invResult = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1;",
      [req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid company: ${req.params.code}`, 404);
    }

    const company = result.rows[0];
    const invoices = invResult.rows;

    company.invoices = invoices.map((inv) => inv.id);

    return res.json({ company: company });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let { code, name, description } = req.body;
    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description;",
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    let { name, description } = req.body;

    const result = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description;",
      [name, description, req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid company: ${req.params.code}`, 404);
    } else {
      return res.json({ company: result.rows[0] });
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM companies WHERE code=$1 RETURNING code;",
      [req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid company: ${req.params.code}`, 404);
    } else {
      return res.json({ status: "deleted" });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
