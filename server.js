import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { Pool } from 'pg'
import 'dotenv/config';
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

const tableMap = {
  [process.env.MAPPING_ENCODED_FIRST]: process.env.MAPPING_TABLE_FIRST
};

app.post('/api/addData', async (req, res) => {
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
    await pool.query(`INSERT INTO ${tableMap[mapping]} (${colonnes.join(',', ' ')}) VALUES (${iteration.join(',', ' ')})`, values);
  
  } catch (e) {
    console.log("ERROR",e);
  }

});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});