const Koa = require('koa');
const router = require('koa-router')();
const https = require('https');
const fs = require('fs');

/*
    config.local.json should contain following keys:
    {
        "ADFSMetadata": "https://your-fs-domain.com/FederationMetadata/2007-06/FederationMetadata.xml",
        "port": "Application port",
        "realm": "Application urn, configured in ADFS",
        "identityProviderUrl": "https://your-fs-domain.com/adfs/ls",
        "thumbprint": "43D5945D67D593A99157C5CBD9F42DAB20002949"    
            thumbprint - thumbprint of your ssl certificate.
            Hack: If you don't want to generate it, just type anything.
            When saml library check it (in authorization callback),
            It will throw an error "Error: Invalid thumbprint (configured: bla-bla, bla-bla. calculated: 'This one you needed')"
            Just get calculated thumbprint :)                                   
    }
*/
const config = require('../config.local.json');

const app = new Koa();

const session = require('koa-session');
app.keys = ['your-session-secret'];
app.use(session({}, app));

const bodyParser = require('koa-bodyparser');
app.use(bodyParser());

require('./passportStrategyConfig');
const passport = require('koa-passport');
app.use(passport.initialize());
app.use(passport.session());

/* url here should be equal to configured callback url in adfs */
router.post('/',
passport.authenticate('wsfed-saml2', { failureRedirect: '/error', failureFlash: true }),
(ctx) => {
    ctx.redirect('/app');   
}
);

router.get('/login', 
passport.authenticate('wsfed-saml2', { failureRedirect: '/error', failureFlash: true }),
(ctx) => {
    ctx.redirect('/app');   
}
);

router.get('/logout', (ctx) => {
ctx.logout();
ctx.redirect('/');
});


router.get('/', async (ctx) => {
    ctx.status = 200;
    ctx.body = "This page is not require authorization";
});

router.get('/error', async (ctx) => {
    ctx.body = 'Error!';
    ctx.status = 200;
});

router.get('/app', function(ctx) {   
    if (ctx.isAuthenticated()) {
        ctx.status = 200;
        const user = ctx.state.user;
        const claimExample = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        ctx.body = "You are authenticated. Claim: " + claimExample;        
        return;
    } else {
        ctx.redirect('/login');
    }
})

app.use(router.routes());

// SSL options 
var options = {
    key: fs.readFileSync('./cert/localhost.key'),
    cert: fs.readFileSync('./cert/localhost.cert')
}

https.createServer(options, app.callback()).listen(config.port, (err) => {
    if (err) {
        return console.error(err);
    }
    console.info('https app is up and running on port ' + config.port);
});
