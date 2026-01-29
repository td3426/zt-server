/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

const _ = require('lodash');
const routemap = require('./routemap');

function parseRoutemap(routemap, prePoli) {
    let polis = {};
    _.each(routemap, function(v, k) {
        let ks = k.split(' ');
        let poli = prePoli;
        if(ks.length < 2) throw new Error('parse route map faild: ' + k + 'is not a valid route key.');
        if(ks.length == 3) poli = ks[2] == 'true' ? true : ks[2];
        switch(ks[0]) {
            case 'group':
                if(typeof v != 'object') throw new Error('parse route map faild: ' + v + 'is not a valid route value.');

                _.assign(polis, parseRoutemap(v, poli));
            break;
            case 'get':
            case 'post':
            case 'all':
                if(typeof v != 'string') throw new Error('parse route map faild: ' + v + 'is not a valid route value.');
                
                polis[v.replace('.', '/')] = poli;
            break;
            default:
                throw new Error('parse route map faild: ' + k + 'is not a valid route key.');
            break;
        }
    });

    return polis;
}

let ret = parseRoutemap(routemap, '/');
ret['*'] = 'default';

// console.log(ret);

module.exports.policies = ret;



// module.exports.policies = {

//     /***************************************************************************
//      *                                                                          *
//      * Default policy for all controllers and actions, unless overridden.       *
//      * (`true` allows public access)                                            *
//      *                                                                          *
//      ***************************************************************************/

//     '*': 'check-permission',
//     // 'admin/login': true,
//     // 'admin/login-auth': true,

//     // MyController: {
//     //     'genLoginCode': true,
//     //     'genRegisterCode': true,
//     //     'genResetPasswdCode': true,

//     //     'login': true,
//     //     'loginPasswdAuth': true,
//     //     'loginCodeAuth': true,

//     //     'register': true,
//     //     'registerAuthByMobile': true,
//     //     'registerByInviteAuth': true,

//     //     'findPassword': true,
//     //     'findPasswordAuth': true
//     // },
//     // MyCompanyController: {
//     //     'fddVerifyNotify': true,
//     //     'fddVerifyReturn': true
//     // },
//     // StoreController: {
//     //     'home': true
//     // },
//     TestController: {
//         '*': true
//     },


//     "usercenter/webapiv1/CaptchaController": {
//         'create': true
//     },
//     "usercenter/webapiv1/MobileCodeController": {
//         '*': true
//     },
//     "usercenter/webapiv1/LoginController": {
//         'authAccount': true,
//         'authMobile': true
//     },
//     "usercenter/webapiv1/RegisterByAccountController": {
//         'authMobile': true
//     },
//     "usercenter/webapiv1/RegisterByInviteController": {
//         'authCode': true
//     },
//     "usercenter/webapiv1/FindPasswordController": {
//         'reset': true
//     },
//     "usercenter/webapiv1/CompanyController": {
//         'fddVerifyNotify': true
//     },
//     "transcenter/webapiv1/TransactionController": {
//         'fddSignNotify': true
//     }
// };
