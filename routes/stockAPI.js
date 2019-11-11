'use strict';

const fetch = require('node-fetch');
const token = process.env.TOKEN;

module.exports = function(stock) {
  if (!Array.isArray(stock)) {
    return fetch(`https://cloud.iexapis.com/stable/stock/${stock}/quote?token=${token}`).then(result =>
      result.json()
    );
  } else {
    return Promise.all([
      fetch(`https://cloud.iexapis.com/stable/stock/${stock[0]}/quote?token=${token}`).then(result =>
        result.json()
      ),
      fetch(`https://cloud.iexapis.com/stable/stock/${stock[1]}/quote?token=${token}`).then(result =>
        result.json()
      )
    ]);
  }
};
