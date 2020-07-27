const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const config = require.main.require('./config');

const User = require.main.require('./models/User').model;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: config.token.secret,
    passReqToCallback: true
};


passport.use('website-bearer', new JwtStrategy(opts, (req, token, done) => {
    const query = {
        _id: token.UserId
    };
    const project = {
        _id: 1
    };
    if(!req.params.clientid){
        return done(null, false, {
            error: {
                message: 'Client Id is missing'
            }
        });
    }
    if (token.iat*1000 < Date.now()) {
        return done(null, false, {
            status: 401,
            error: {
                message: utilities.ErrorMessages.TOKEN_EXPIRED
            }
        });
    }
    User.findOne(query, project, (err, user) => {
        try{
            if (err) {
                return done(err, false);
            } else if (user) {
                const claims=token.Claims.split('|')[0].split(':');
                if (claims[0] !== 'Client' || claims[1] !== req.params.clientid) {
                    return done(null, false, {
                        error: {
                            message: 'Invalid Claims'
                        }
                    });
                }
                done(null, user, null);
            } else {
                return done(null, false, {
                    error: {
                        message: 'Unknown User'
                    }
                });
            }
        } catch(err){
            return done(err, false);
        }
    });
}));