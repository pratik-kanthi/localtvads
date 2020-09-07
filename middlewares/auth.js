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
    try {
        const query = {
            _id: token.UserId
        };
        const project = {
            _id: 1
        };

        if (token.iat * 1000 < Date.now()) {
            return done(null, false, {
                status: 401,
                error: {
                    message: utilities.ErrorMessages.TOKEN_EXPIRED
                }
            });
        }
        User.findOne(query, project, (err, user) => {
            if (err) {
                return done(err, false);
            } else if (user) {
                const customUser = JSON.parse(JSON.stringify(user));
                customUser.Claims = token.Claims.split('|').map((c) => {
                    const s = c.split(':');
                    return {
                        Name: s[0],
                        Value: s[1]
                    };
                });
                done(null, customUser, null);
            } else {
                logger.logDebug('Unknown user');
                return done(null, false, {
                    error: {
                        message: 'Unknown User'
                    }
                });
            }
        });
    } catch (err) {
        logger.logError('Auth Middleware Error for bearer:jwt', err);
        return done(null, false, {
            error: {
                message: 'Server Error'
            }
        });

    }

}));