import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { Pool } from 'pg'
import 'dotenv/config';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from "bcrypt"
import crypto from 'crypto';
const app = express();
const PORT = 3000;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.CREDENTIAL,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      secure: false
    }
  })
);

const tableMap = {
  [process.env.MAPPING_ENCODED_FIRST]: process.env.MAPPING_TABLE_FIRST,
  [process.env.MAPPING_ENCODED_SECOND]: process.env.MAPPING_TABLE_SECOND,
  [process.env.MAPPING_ENCODED_THREE]: process.env.MAPPING_TABLE_THREE,
  [process.env.MAPPING_ENCODED_FOUR]: process.env.MAPPING_COLUMN_FOUR,
  [process.env.MAPPING_ENCODED_FIVE]: process.env.MAPPING_COLUMN_FIVE,
  [process.env.MAPPING_ENCODED_SIX]: process.env.MAPPING_COLUMN_SIX
};

app.post('/api/register', async (req, res) => {
  try {
    const { data } = req.body;
    const saltRounds = 14;

    if(data.password !== data.re_password) {
      return res.json({exists: false, message: "Passwords do not match"});
    }
    const hashEmail = crypto.createHash('sha256').update(data.mail).digest('hex');
    const result = await pool.query(`SELECT EXISTS (SELECT 1 FROM ${tableMap[process.env.MAPPING_ENCODED_THREE]} WHERE ${process.env.MAPPING_COLUMN_FIVE} = $1);`, [hashEmail]);

    if(result.rows[0].exists) {
      return res.json({exists: false, message: "Email already exists"});
    }

    const hashPass = crypto.createHash('sha256').update(data.password).digest('hex');
    await pool.query(`INSERT INTO ${tableMap[process.env.MAPPING_ENCODED_THREE]} (${tableMap[process.env.MAPPING_ENCODED_FIVE]}, ${tableMap[process.env.MAPPING_ENCODED_SIX]}) VALUES ($1, $2)`, [hashEmail, hashPass])
    res.json({exists: true});

  } catch (e) {
    res.status(500).json({error: "Internal server error"});
  }
});

app.post('/api/auth', async (req, res) => {
  try {
    const { data } = req.body;

    const hashEmail = crypto.createHash('sha256').update(data.mail).digest('hex');
    const resultmail = await pool.query(`SELECT EXISTS (SELECT 1 FROM ${tableMap[process.env.MAPPING_ENCODED_THREE]} WHERE ${process.env.MAPPING_COLUMN_FIVE} = $1);`, [hashEmail]);

    const hashPassword = crypto.createHash('sha256').update(data.password).digest('hex');
    const resultpassword = await pool.query(`SELECT EXISTS (SELECT 1 FROM ${tableMap[process.env.MAPPING_ENCODED_THREE]} WHERE ${process.env.MAPPING_COLUMN_SIX} = $1);`, [hashPassword]);

    if(!resultmail.rows[0].exists) {
      return res.json({exists: false, message: "Wrong Email"});
    }

    if(!resultpassword.rows[0].exists) {
      return res.json({exists: false, message: "Wrong Password"});
    }
    res.json({exists: true});

  } catch (e) {
    res.status(500).json({error: "Internal server error"});
  }
});

app.post('/api/createRole', async (req, res) => {
  const { data, mapping } = req.body;
  const iteration = [];
  const colonnes = []
  const values = []
  let removeIteration = 0;

  try {
    for (let [index, key] of Object.keys(data).entries()) {
      if(data[key] !== "") {
        iteration.push(`$${index+1-removeIteration}`);
        colonnes.push(key);
        values.push(data[key])
      } else {
        removeIteration++;
      }
    }
    const query = `INSERT INTO ${tableMap[mapping]} (${colonnes.join(', ')}) VALUES (${iteration.join(', ')}) RETURNING id_${tableMap[mapping]}`;
    const result = await pool.query(query, values);
    const id_user = result.rows[0][`id_${tableMap[mapping]}`];

    const secondQuery = `INSERT INTO ${tableMap[process.env.MAPPING_ENCODED_THREE]} (id_${tableMap[mapping]}, ${tableMap[process.env.MAPPING_ENCODED_FOUR]}, mail) VALUES ($1, $2, $3)`;
    await pool.query(secondQuery, [id_user, tableMap[mapping], data.mail]);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log("ERROR",e);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});