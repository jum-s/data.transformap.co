const logger = require('morgan')
const CONFIG = require('config')
const passport = require('./middlewares/passport')

const cors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

module.exports = {
  common: [
    passport.initialize,
    passport.session({
      secret: CONFIG.get('auth.passportSessionSecret'),
      resave: true,
      saveUninitialized: true,
      pauseStream: true
    }),
    require('body-parser').json(),
    require('method-override')(),
    require('errorhandler')({ dumpExceptions: true, showStack: true }),
    cors
  ],
  development: [
    logger('dev')
  ],
  production: [
    logger('short')
  ]
}
