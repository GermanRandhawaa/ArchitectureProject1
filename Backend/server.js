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
const config = require('./config');
const app = express();

app.use(express.static(__dirname));

app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    credentials: true,
  })
);
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

if (connection) {
  console.log(config.db.connected);
}

app.get("/index", verifyToken, (req, res) => {
  res.send("$$$$");
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
      console.log(config.token);
    }
  } catch (error) {
    console.error("Error:", error);
  }

  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error(config.db.err, error);
      res.status(500).json({ message: config.db.err });
    } else {
      // Increment the API call count for the specific user
      userApiCallCounts[username] = (userApiCallCounts[username] || 0) + 1;

      console.log(`${username} API Call Count:`, userApiCallCounts[username]); // Log the API call count

      if (results.length > 0) {
        const { password: hashedPassword, role } = results[0];
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
          // Update the api_calls column in the calls table
          const updateQuery =
            "INSERT INTO calls (username, api_calls) VALUES (?, 1) ON DUPLICATE KEY UPDATE api_calls = api_calls + 1";
          connection.query(updateQuery, [username], (updateError) => {
            if (updateError) {
              console.error("Error updating api_calls:", updateError);
              res.status(500).json({ message: config.api });
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
              res.json({
                message: config.db.login,
                role,
                apiCallCount: userApiCallCounts[username],
              });
            }
          });
          connection.query(
            "SELECT * FROM epcounter WHERE username = ?",
            [username],
            (error, results) => {
              if (error) {
                console.error(config.db.username, error);
                res.status(500).json({ error: config.server });
              } else if (results.length === 0) {
                // Username not found, initialize with a value of 1
                connection.query(
                  "INSERT INTO epcounter (username, descAnalysis, resumeFeedback, jobFeedback, calls, login, userinfos, deleteCount) VALUES (?, 0, 0, 0, 0, 1, 0, 0);",
                  [username],
                  (insertError) => {
                    if (insertError) {
                      console.error(
                        config.db.username,
                        insertError
                      );
                    } 
                  }
                );
              }else{
                login_counter(username)
              }
            }
          );
        } else {
          res.status(401).json({ message: config.db.credentials });
        }
      } else {
        res.status(401).json({ message: config.db.credentials });
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
          console.error(config.db.register_err, error);
          res
            .status(500)
            .json({ message: config.db.register_err, error: error.message });
        } else {
          res.status(201).json({ message: config.db.register });
        }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: config.db.register_err });
  }
});

const getAllUserInfos = (req, res) => {
  const query = "SELECT username, email FROM users";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error querying user information:", error);
      res.status(500).json({ message: "Error querying user information" });
    } else {
      // Send user information as a JSON response
      res.json(results);
    }
  });
};

const getAllUserCalls = (req, res) => {
  const query = "SELECT * FROM calls";
  connection.query(query, (error, results) => {
    if (error) {
      console.error(config.user_info, error);
      res.status(500).json({ message: config.user_info });
    } else {
      // Send user information as a JSON response
      res.json(results);
    }
  });
};

const getAllUserEp = (req, res) => {
  const query = "SELECT * FROM epcounter";
  connection.query(query, (error, results) => {
    if (error) {
      console.error(config.user_info, error);
      res.status(500).json({ message: config.user_info });
    } else {
      // Send user information as a JSON response
      res.json(results);
    }
  });
};

app.get("/get-all-users", getAllUserInfos);
app.get("/get-calls", getAllUserCalls);
app.get("/get-ep", getAllUserEp);

const deleteUser = (req, res) => {
  const { username } = req.params;

  // Delete the user from the database
  const deleteQuery = "DELETE FROM users WHERE username = ?";
  connection.query(deleteQuery, [username], (error, results) => {
    if (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    } else {
      // Check if the user was found and deleted
      if (results.affectedRows > 0) {
        console.log(`User ${username} deleted successfully`);
        del()
        res.json({ message: `User ${username} deleted successfully` });
      } else {
        res.status(404).json({ message: `User ${username} not found` });
      }
    }
  });
};

// Endpoint to delete a user (no authorization required)
app.delete("/users/:username", deleteUser);

app.patch("/incrementCount/:username", async (req, res) => {
  const { username } = req.params;
  const countQuery = "SELECT api_calls FROM calls WHERE username = ?";
  let count = 0;
  connection.query(countQuery, [username], (error, results) => {
    if (error) {
      console.error(config.db.err, error);
      res.status(500).json({ message: config.db.err });
    } else {
      count = results[0];
      res.json({ count });
    }
  });
  const updateQuery = "UPDATE calls SET api_calls = ? WHERE username = ?";
  connection.query(updateQuery, [count + 1, username], (error) => {
    if (error) {
      console.error(config.db.err, error);
    }
  });
});

app.get("/apiCallCount/:username", (req, res) => {
  const { username } = req.params;
  const countQuery = "SELECT api_calls FROM calls WHERE username = ?";
  connection.query(countQuery, [username], (error, results) => {
    if (error) {
      console.error(config.db.err, error);
      res.status(500).json({ message: config.db.err });
    } else {
      console.log("counts fetched");
      calls_counter(username);
      const count = results[0];
      res.json({ count: count });

    }
  });
});

app.patch("/description-analysis/:username", (req, res) => {
  const { username } = req.params;
  const updateQuery =
    "UPDATE epcounter SET descAnalysis = IFNULL(descAnalysis, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config.description, updateError);
      res.status(500).json({ error: config.description });
    } else {
      res.json({ message: config.updateSuccess });
    }
  });
});

app.patch("/resume-feedback/:username", (req, res) => {
  const { username } = req.params;
  const updateQuery =
    "UPDATE epcounter SET resumeFeedback = IFNULL(resumeFeedback, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config["resume-feedback"], updateError);
      res.status(500).json({ error: config["resume-feedback"] });
    } else {
      res.json({ message: config.updateSuccess });
    }
  });
});

app.patch("/job-feedback/:username", (req, res) => {
  const { username } = req.params;
  const updateQuery =
    "UPDATE epcounter SET jobFeedback = IFNULL(jobFeedback, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config["job-feedback"], updateError);
      res.status(500).json({ error: config["job-feedback"] });
    } else {
      res.json({ message: config.updateSuccess });
    }
  });
});

function calls_counter(username){
  const updateQuery =
    "UPDATE epcounter SET calls = IFNULL(calls, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config.calls_counter, updateError);
    } 
  });
};

function login_counter(username) {
  const updateQuery =
    "UPDATE epcounter SET login = IFNULL(login, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config.login_counter, updateError);
    } 
  });
};

app.patch("/userinfos/:username", (req, res) => {
  const { username } = req.params;
  const updateQuery =
    "UPDATE epcounter SET userinfos = IFNULL(userinfos, 0) + 1 WHERE username = ?";

  connection.query(updateQuery, [username], (updateError) => {
    if (updateError) {
      console.error(config.userinfos, updateError);
      res.status(500).json({ error: config.userinfos });
    } else {
      res.json({ message: config.updateSuccess });
    }
  });
})

function del() {
  const updateQuery =
    "UPDATE epcounter SET deleteCount = IFNULL(deleteCount, 0) + 1 WHERE username = pahul";

  connection.query(updateQuery, (updateError) => {
    if (updateError) {
      console.error(config.delCounter, updateError);
    } 
  });
}

app.listen(port, () => {
  console.log(config.listen + " " + port);
});

module.exports = app;
