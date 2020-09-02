const Promise = require('bluebird');
Promise.almost = (r) => Promise.all(r.map(p => p.catch ? p.catch(e => e) : p));