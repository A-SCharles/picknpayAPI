// Importing modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./config/dbconn");
const jwt = require("jsonwebtoken");
const {
  compare,
  hash
} = require("bcrypt");
// Express app
const app = express();
// Express router
const router = express.Router();
// Configuration
const port = parseInt(process.env.PORT);

app.use((req, res, next) => {
  // res.setHeader("Access-Control-Allow-Origin", "*");
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  })
  next();
});

app.use(
  express.static("public"),
  router,
  cors(),
  express.json(),
  express.urlencoded({
    extended: true,
  })
);
//
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// home
router.get("/", (req, res) => {
  res.sendFile(__dirname + "/" + "index.html");
});
// User registration
router.post("/register", bodyParser.json(), async (req, res) => {
  try {
    const bd = req.body;
    if (bd.userRole === "" || bd.userRole === null) {
      bd.userRole = "user";
    }

    const emailQ = "SELECT email from users WHERE ?";
    let email = {
      email: bd.email
    }
    db.query(emailQ, email, async (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({
          error: "Email Exists"
        });
        // res.send("Email Exists");
      } else {
        // Encrypting a password
        // Default value of salt is 10.
        bd.userpassword = await hash(bd.userpassword, 10);
        // Query
        const strQry = `
        INSERT INTO users(firstname, lastname, gender, address, userRole, email, userpassword)
        VALUES(?, ?, ?, ?, ?, ?, ?);
        `;
        db.query(
          strQry,
          [
            bd.firstname,
            bd.lastname,
            bd.gender,
            bd.address,
            bd.userRole,
            bd.email,
            bd.userpassword,
          ],
          (err, results) => {
            if (err) throw err;
            // res.send(`number of affected row/s: ${results.affectedRows}`);
            res.json({
              msg: "Registration Successful"
            });
          }
        );
      }
    });
  } catch (e) {
    console.log(`From registration: ${e.message}`);
  }
});
// register dummy data
// {
//     "firstname" : "Charles",
//     "lastname" : "Thomas",
//     "gender" : "Male",
//     "address" : "blank",
//     "userRole" : "Admin",
//     "email" : "charles@gmail.com",
//     "userpassword" : "dog"
//   }

// Login
router.post("/login", bodyParser.json(), (req, res) => {
  try {
    // Get email and password
    const {
      email,
      userpassword
    } = req.body;
    const strQry = `
        SELECT *
        FROM users 
        WHERE email = '${email}';
        `;
    db.query(strQry, async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        res.json({
          msg: "Email not found, Please Register"
        });
      } else {
        const ismatch = await compare(userpassword, results[0].userpassword);
        // res.json({
        //   results: await compare(userpassword, results[0].userpassword),
        //   // ? results
        //   // : "You provided a wrong password",
        // });
        // res.send(results),
        if (ismatch === true) {
          const payload = {
            user: {
              id: results[0].id,
              firstname: results[0].firstname,
              lastname: results[0].lastname,
              gender: results[0].gender,
              email: results[0].email,
              userRole: results[0].userRole,
              address: results[0].address,
            },
          };
          jwt.sign(
            payload,
            process.env.jwtSecret, {
              expiresIn: "365d",
            },
            (err, token) => {
              res.header({
                'x-auth-token': token
              })
              if (err) throw err;
              res.json({
                user: payload.user,
                token: token,
                msg: "Login Successful"

              });
              // res.json(payload.user);
            }
          );
        } else {
          res.json({
            msg: "You entered the wrong password"
          });
          // res.send("You entered the wrong password");
        }
      }
    });
  } catch (e) {
    console.log(`From login: ${e.message}`);
  }
});

// Verify
router.get("/users/verify", (req, res) => {
  // res.setHeader({
  //   'x-auth-token': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo4LCJmaXJzdG5hbWUiOiJCb2kiLCJsYXN0bmFtZSI6ImEiLCJnZW5kZXIiOiJjIiwiZW1haWwiOiJhLmNoYXJsZXMuZWR1QGdtYWlsLmNvbSIsInVzZXJSb2xlIjoidXNlciIsImFkZHJlc3MiOiJibGFuayJ9LCJpYXQiOjE2NTk4Njg1OTEsImV4cCI6MTY5MTQwNDU5MX0.2bHIFOOyJ9TumjclQ5ONfdCkWTsC4peAZ7tpQC3xAvY"
  // })
  const token = req.header("x-auth-token");
  jwt.verify(token, process.env.jwtSecret, (error, decodedToken) => {
    if (error) {
      res.status(401).json({
        msg: "Unauthorized Access!",
      });
    } else {
      res.status(200);
      res.send(decodedToken);
    }
  });
});

// Create new products
router.post("/products", bodyParser.json(), (req, res) => {
  try {
    const bd = req.body;
    bd.totalamount = bd.quantity * bd.price;
    // Query
    const strQry = `
        INSERT INTO products(prodName, prodUrl, quantity, price, totalamount, dateCreated)
        VALUES(?, ?, ?, ?, ?, ?);
        `;
    //
    db.query(
      strQry,
      [
        bd.prodName,
        bd.prodUrl,
        bd.quantity,
        bd.price,
        bd.totalamount,
        bd.dateCreated,
      ],
      (err, results) => {
        if (err) throw err;
        res.send(`number of affected row/s: ${results.affectedRows}`);
      }
    );
  } catch (e) {
    console.log(`Create a new product: ${e.message}`);
  }
});
// add product dummy data
/* 
{
  "prodName":"Banana",
  "prodUrl":"https://i.postimg.cc/DZ7pV6mR/png-transparent-banana-banana-natural-foods-food-fitness-thumbnail.png",
  "quantity":5,
  "price":27.99,
  "dateCreated":"2022-08-02 00:00:00"
}
*/

// Get all products
router.get("/products", (req, res) => {
  // Query
  const strQry = `
    SELECT id, prodName,prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products;
    `;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.json(
      // results
      {
        status: 200,
        results: results,
      }
    );
  });
});

// Get users
router.get("/users", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM users;
    `;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: results,
    });
  });
});

// Get one product
router.get("/products/:id", (req, res) => {
  // Query
  const strQry = `
    SELECT id, prodName, prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products
    WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json(
      // results
      {
        status: 200,
        results: results.length <= 0 ? "Sorry, no product was found." : results,
      }
    );
  });
});

// Update product
router.put("/products/:id", (req, res) => {
  const bd = req.body;
  // Query
  const strQry = `UPDATE products
     SET ?
     WHERE id = ?`;

  db.query(strQry, [bd.id], (err, data) => {
    if (err) throw err;
    res.send(`number of affected record/s: ${data.affectedRows}`);
  });
});

// Delete product
router.delete("/products/:id", (req, res) => {
  // Query
  const strQry = `
    DELETE FROM products 
    WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err, data, fields) => {
    if (err) throw err;
    res.send(`${data.affectedRows} row was affected`);
  });
});