import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "miguel123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkUsers() {
  const result = await db.query("SELECT * FROM users_country");
  let users = [];
  result.rows.forEach((user) => {
    users.push(user);
  })
  console.log(users);
  return users;
}

async function currentUser() {
  const result = await db.query("SELECT * FROM users_country");
  return (result.rows).find((user) => user.id == currentUserId);
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users = await checkUsers();
  const currUser = await currentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  console.log(currentUserId);

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add == "new"){
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  console.log(req.body);
  let userName = req.body.name;
  let userColor = req.body.color;
  try {
    await db.query("INSERT INTO users_country (name, color) VALUES ($1, $2)",[userName, userColor]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("new.ejs",{
      error: err,
    })
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
