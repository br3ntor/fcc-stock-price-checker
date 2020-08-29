/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
const stockAPI = require("./stockAPI");
const stockHandler = require("../controllers/stockHandler");

const CONNECTION_STRING = process.env.DB;

module.exports = function(app) {
  MongoClient.connect(CONNECTION_STRING, function(err, db) {
    if (err) throw err;
    console.log("Connected successfully to db server");

    const dbController = new stockHandler(db, "myStocks");

    app.route("/api/stock-prices").get(function(req, res) {
      const stock = req.query.stock;

      // The x-forwarded-for header should get replaced by req.headers.host for test requests
      const ip = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",")[0]
        : req.headers.host.split(":")[0];

      const like = req.query.like;
      const voteIp = like ? ip : false;

      // Handle edge case of two same stocks being compared
      if (Array.isArray(stock)) {
        if (stock[0] === stock[1]) {
          return res.send("Please enter two DIFFERNT stocks. Thanks you.");
        }
      }

      // Get quote for stock
      stockAPI(stock)
        .then(data => {
          // Handle one stock
          if (!Array.isArray(data)) {
            dbController.findOne(data.symbol).then(doc => {
              const validVoteIp =
                doc && !doc.stockData.voters.includes(ip) && like ? ip : false;

              if (doc) {
                dbController.updateOne(data, validVoteIp).then(r => {
                  if (r.result.ok) {
                    res.json({
                      stockData: {
                        stock: data.symbol,
                        price: data.latestPrice,
                        likes: validVoteIp
                          ? doc.stockData.likes + 1
                          : doc.stockData.likes
                      }
                    });
                  }
                });
              } else {
                dbController.insertOne(data, voteIp).then(r => {
                  if (r.result.ok) {
                    res.json({
                      stockData: {
                        stock: data.symbol,
                        price: data.latestPrice,
                        likes: like ? 1 : 0
                      }
                    });
                  }
                });
              }
            });

            // Handle two stocks
          } else {
            dbController.findTwo(data).then(docs => {
              if (docs.length === 0) {
                console.log("Neither stock in database");
                dbController.insertMany(data, voteIp).then(r => {
                  const response = doubleResponseObject(r.ops);
                  res.json(response);
                });
              }

              if (docs.length === 1) {
                console.log("One of the stocks is in the database");
                const stockInDB =
                  docs[0].stockData.stock === data[0].symbol
                    ? data[0]
                    : data[1];
                const stockNotInDB =
                  docs[0].stockData.stock === data[0].symbol
                    ? data[1]
                    : data[0];
                const validVoteIp =
                  !docs[0].stockData.voters.includes(ip) && like ? ip : false;

                // Need to check if stocks are the same and either compare them or say they are the same
                Promise.all([
                  dbController.updateOne(stockInDB, validVoteIp),
                  dbController.insertOne(stockNotInDB, voteIp)
                ]).then(r => {
                  if (r[0].result.ok === r[1].result.ok) {
                    dbController.findTwo(data).then(d => {
                      const response = doubleResponseObject(d);
                      res.json(response);
                    });
                  }
                });
              }

              if (docs.length === 2) {
                console.log("Both stocks are in the database");
                const firstVote =
                  !docs[0].stockData.voters.includes(ip) && like ? ip : false;
                const secondVote =
                  !docs[1].stockData.voters.includes(ip) && like ? ip : false;
                const firstStock =
                  docs[0].stockData.stock === data[0].symbol
                    ? data[0]
                    : data[1];
                const secondStock =
                  docs[0].stockData.stock === data[0].symbol
                    ? data[1]
                    : data[0];

                Promise.all([
                  dbController.updateOne(firstStock, firstVote),
                  dbController.updateOne(secondStock, secondVote)
                ]).then(r => {
                  if (r[0].result.ok === r[1].result.ok) {
                    dbController.findTwo(data).then(d => {
                      const response = doubleResponseObject(d);
                      res.json(response);
                    });
                  }
                });
              }
              if (docs.length > 2) {
                res.send("One of the stocks is duplicated in the db!");
              }
            });
          }
        })
        .catch(error => {
          if (error) console.log(error);
          res.send("Invalid stock");
        });
    });

    app.use(function(req, res, next) {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });
  });
};

function doubleResponseObject(data) {
  return {
    stockData: [
      {
        stock: data[0].stockData.stock,
        price: data[0].stockData.price,
        rel_likes: data[0].stockData.likes - data[1].stockData.likes
      },
      {
        stock: data[1].stockData.stock,
        price: data[1].stockData.price,
        rel_likes: data[1].stockData.likes - data[0].stockData.likes
      }
    ]
  };
}
