
const moment = require('moment');

module.exports = {


    friendlyName: 'create captcha',


    description: 'create captcha',


    inputs: {

    },


    fn: async function (inputs, exits) {

        moment.locale('zh-cn');

		var ret = require('../common/util').createCaptcha();
        console.log('captcha: ' + ret.text + '\ncaptcha_token: ' + ret.token);

        return exits.success();
    }

};
