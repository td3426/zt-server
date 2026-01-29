const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

    create: async function(req, res) {
        var captcha = cutil.createCaptcha({
            size: 4,
            ignoreChars: '0oO1iIl',
            noise: 1,
            width: 150,
            height: 50
        });

        var ret = {
            svg: captcha.svg,
            token: captcha.token
        };

        return res.jsonok(ret);
    },

};
