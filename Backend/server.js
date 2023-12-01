"use strict";
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

const app = express();
const fs = require('fs');
const path = require('path');
// app.use(express.static(path.join(__dirname, "../Frontend")));
// app.get("/admin.html", function (req, res) {
//   res.sendFile(path.join(__dirname, "../Frontend/admin.html"));
// });

app.use(express.static(__dirname));

app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true,
}));
app.use(helmet());
app.use(express.urlencoded({ extended: true }));


const connection = mysql.createConnection(process.env.DATABASE_URL);

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt; 
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        res.clearCookie("jwt"); 
        res.redirect("/login"); 
      } else {
        req.user = decoded; 
        next(); 
      }
    });
  } else {
    res.redirect("/login"); 
  }
};

// const connection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "archPRoject1",
// });

if (connection) {
  console.log("Connected to database");
}

app.get("/index", verifyToken, (req, res) => {
  res.send("Hello World");
});


const userApiCallCounts = {};

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const token = req.cookies && req.cookies.jwt;
    if (token) {
      try {
        const decoded = jwt.verify(token, secretKey);
        console.log(decoded);
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("No token found in cookies");
    }
  } catch (error) {
    console.error("Error:", error);
  }

  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ message: "Error querying database" });
    } else {
      // Increment the API call count for the specific user
      userApiCallCounts[username] = (userApiCallCounts[username] || 0) + 1;

      console.log(`${username} API Call Count:`, userApiCallCounts[username]); // Log the API call count

      if (results.length > 0) {
        const { password: hashedPassword, role } = results[0];
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
          // Update the api_calls column in the calls table
          const updateQuery = "INSERT INTO calls (username, api_calls) VALUES (?, 1) ON DUPLICATE KEY UPDATE api_calls = api_calls + 1";
          connection.query(updateQuery, [username], (updateError) => {
            if (updateError) {
              console.error("Error updating api_calls:", updateError);
              res.status(500).json({ message: "Error updating api_calls" });
            } else {
              const token = jwt.sign({ username, role }, secretKey, {
                expiresIn: "1h",
              });

              res.cookie("jwt", token, {
                httpOnly: true,
                maxAge: 3600000, // 1 hour
                sameSite: "strict",
              });

              // Send the user's role along with the successful login message
              res.json({ message: "Login successful", role, apiCallCount: userApiCallCounts[username] });
            }
          });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  });
});



app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 
    const insertQuery =
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
    connection.query(
      insertQuery,
      [username, email, hashedPassword, "user"],
      (error, results) => {
        if (error) {
          console.error("Error registering user:", error); 
          res
            .status(500)
            .json({ message: "Error registering user", error: error.message }); 
        } else {
          res.status(201).json({ message: "User registered successfully" });
        }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});


app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

module.exports = app;
