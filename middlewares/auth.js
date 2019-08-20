const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const config = require.main.require('./config');

const User = require.main.require('./models/User').model;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: config.token.secret
};

passport.use(new JwtStrategy(opts, (token, done) => {
    let query = {
        _id: token.UserId
    };
    let project = {
        _id: 1
    };
    User.findOne(query, project, (err, user) => {
        if (err) {
            return done(err, false);
        } else if (user) {
            let customUser = JSON.parse(JSON.stringify(user));
            customUser.Claims = token.Claims.split('|').map(function (c) {
                let s = c.split(':');
                return {
                    Name: s[0],
                    Value: s[1]
                }
            });
            done(null, customUser, null);
        } else {
            return done(null, false, {
                error: {
                    message: 'Unknown User'
                }
            });
        }
    });
}));