const passport = require('koa-passport');
const wsfedsaml2 = require('passport-wsfed-saml2').Strategy;

const config = require('../config.local.json');

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use('wsfed-saml2', new wsfedsaml2({
	path: '/login/callback', /* for some reason this key is not working over configured in adfs callback path */
    realm: config.realm,
    identityProviderUrl: config.identityProviderUrl,
	thumbprint: config.thumbprint
}, function (profile, done) {
    done(null, profile);
}));
