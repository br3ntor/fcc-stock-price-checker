'use strict';

module.exports = class Controller {
  constructor(db, dbName) {
    this.db = db.collection(dbName);
  }

  findOne(stock) {
    return this.db.findOne({ 'stockData.stock': stock });
  }

  findTwo(stocks) {
    return this.db.find({ 'stockData.stock': { $in: [stocks[0].symbol, stocks[1].symbol] } }).toArray();
  }

  insertOne(freshStock, ip) {
    return this.db.insertOne({
      stockData: {
        stock: freshStock.symbol,
        price: freshStock.latestPrice,
        likes: ip ? 1 : 0,
        voters: ip ? [ip] : []
      }
    });
  }

  insertMany(freshStock, ip) {
    return this.db.insertMany([
      {
        stockData: {
          stock: freshStock[0].symbol,
          price: freshStock[0].latestPrice,
          likes: ip ? 1 : 0,
          voters: ip ? [ip] : []
        }
      },
      {
        stockData: {
          stock: freshStock[1].symbol,
          price: freshStock[1].latestPrice,
          likes: ip ? 1 : 0,
          voters: ip ? [ip] : []
        }
      }
    ]);
  }

  updateOne(freshStock, ip) {
    if (ip) {
      return this.db.updateOne(
        { 'stockData.stock': freshStock.symbol },
        {
          $set: { 'stockData.price': freshStock.latestPrice },
          $inc: { 'stockData.likes': 1 },
          $push: { 'stockData.voters': ip }
        }
      );
    } else {
      return this.db.updateOne(
        { 'stockData.stock': freshStock.symbol },
        {
          $set: { 'stockData.price': freshStock.latestPrice }
        }
      );
    }
  }
};
