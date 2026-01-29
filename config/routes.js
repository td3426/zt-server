/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

const _ = require('lodash');
const routemap = require('./routemap');


// /***************************************************************************
//  * WEB API 1.0
//  ***************************************************************************/
// function genUCApiV1() {
//     const map = {
//         'post /ue_handle': 'ue.handle',
//         'post /create_captcha': 'captcha.create',
        
//         'post /login/get-mobile-code': 'mobileCode.loginCode',
//         'post /login/refresh-token': 'login.refreshToken',
//         'post /login-by-account/auth': 'login.authAccount',
//         'post /login-by-mobile/auth': 'login.authMobile',
        
//         'post /register/get-mobile-code': 'mobileCode.registerCode',
//         'post /register-by-mobile/auth': 'registerByAccount.authMobile',
//         'post /register-by-mobile/sel-comptype': 'registerByAccount.selCompType',
//         'post /register-by-mobile/add-comp': 'registerByAccount.addComp',

//         'post /register-by-invite/auth': 'registerByInvite.authCode',
//         'post /register-by-invite/set-baseinfo': 'registerByInvite.setBaseinfo',

//         'post /find-password/get-mobile-code': 'mobileCode.resetPasswdCode',
//         'post /find-password/reset': 'findPassword.reset',

//         'post /company/get-verified-comp-by-name': 'company.getCompanyVerifiedStatByName',
//         'post /company/get-compname-by-code': 'company.getCompanyNameByCode',
//         'post /my-company/get-comp-baseinfo': 'company.getCompanyBaseInfo',
//         'post /my-company/get-compinfo': 'company.getCompanyInfo',
//         'post /my-company/set-compinfo': 'company.updateCompanyInfo',
//         'post /fdd/verify_notify': "company.fddVerifyNotify",

//         'post /my-company/get-depts': 'dept.listDept',
//         'post /my-company/get-dept-members': 'dept.listDeptMember',
//         'post /my-company/search-member': 'dept.searchDeptMember',
//         'post /my-company/add-dept': 'dept.addDept',
//         'post /my-company/set-dept': 'dept.updateDept',
//         'post /my-company/delete-dept': 'dept.deleteDept',
//         'post /my-company/set-members-dept': 'dept.updateUsersDept',
//         'post /my-company/remove-members': 'dept.removeUsers',

//         'post /my-company/get-myinfo': 'user.myInfo',
//         'post /my-company/get-multi-userinfo': 'user.list',
//         'post /my-company/set-userinfo': 'user.update',
//         'post /my-company/set-mobile': 'user.updateMobile',
//         'post /my-company/set-password': 'user.updatePassword',

//         'post /my-company/create-invite-code': 'invite.createInviteCode',
//         'post /my-company/send-invite': 'invite.send',

//         'post /my-company/get-roles': 'role.list',
//         'post /my-company/get-role': 'role.detail',
//         'post /my-company/get-priv-struct': 'role.privStruct',
//         'post /my-company/add-role': 'role.add',
//         'post /my-company/set-role': 'role.update',
//         'post /my-company/delete-role': 'role.delete',
//         'post /my-company/get-role-users': 'role.listUsers',
//         'post /my-company/set-role-users': 'role.updateUsers'
//     };

//     var ret = {};
//     _.each(map, function(v, k) {
//         k = k.replace(/\s+/ig, ' ');
//         k = k.replace(/^get /ig, 'get /uc/v1');
//         k = k.replace(/^post /ig, 'post /uc/v1');
//         v = 'usercenter/webapiv1/' + v;
//         ret[k] = v;
//     });

//     // console.log(ret);

//     return ret;
// }

// function genTranscenterApiV1() {
//     const map = {

//         'post /product/get-product': 'product.getProduct',
//         'post /product/get-muti-product': 'product.getProducts',

//         'post /product/get-cats': 'product.getCats',
//         'post /product/get-styles': 'product.getStyles',

//         'post /designer/list-my-comp-products': 'designer.listCompProducts',
//         // 'post /transaction/get-muti-product-sign-stat': 'transaction.getSignStatByProductNos',
//         'post /designer/count-my-comp-added-products': 'designer.countCompAddedProduct',
//         'post /designer/count-my-comp-visited-products': 'designer.countCompVisited',
//         'post /designer/get-my-comp-sales-amount': 'designer.getCompSalesAmount',
//         'post /designer/count-my-comp-signed': 'designer.countCompSigned',
//         'post /designer/my-comp-statistics': 'designer.countComp',
        

//         'post /designer/add-product': 'product.addProduct',
//         'post /designer/set-product': 'product.updateProduct',
//         'post /designer/get-contract-tpls': 'contract.getContractTpls',
//         'post /designer/set-product-contract-proto': 'product.updateProductContractProto',
//         'post /designer/del-product': 'product.deleteProduct',

//         'post /design-mall/list-products': 'designMall.listProduct',
//         'post /design-mall/list-my-comp-products': 'designMall.listMyCompProduct',
//         'post /contract/sign': 'transaction.signContract',
//         'post /fdd/sign-notify': 'transaction.fddSignNotify',

//         'post /sale-handbook/list-comp-products': 'saleHandbook.listProduct',
//         'post /sale-handbook/add-product': 'saleHandbook.addProduct',

//         //todo: 后台管理上传模板到法大大
//         'post /designer/upload-contract-tpls': 'contract.uploadTpl'
        
//     };

//     var ret = {};
//     _.each(map, function(v, k) {
//         k = k.replace(/\s+/ig, ' ');
//         k = k.replace(/^get /ig, 'get /tc/v1');
//         k = k.replace(/^post /ig, 'post /tc/v1');
//         v = 'transcenter/webapiv1/' + v;
//         ret[k] = v;
//     });

//     // console.log(ret);

//     return ret;
// }

// module.exports.routes = {};
// _.assign(module.exports.routes, genUCApiV1());
// _.assign(module.exports.routes, genTranscenterApiV1());

// module.exports.routes['get /test1'] = 'test.test1';
// module.exports.routes['get /test2'] = 'test.test2';
// module.exports.routes['get /test2return'] = 'test.test2return';
// module.exports.routes['post /test2callback'] = 'test.test2callback';


function parseRoutemap(routemap, preUri) {
    let routes = {};
    preUri = preUri.length > 0 && preUri.substr(-1) == '/' 
        ? preUri.substr(0, preUri.length - 1) 
        : preUri;

    _.each(routemap, function(v, k) {
        let ks = k.split(' ');
        if(ks.length < 2) throw new Error('parse route map faild: ' + k + 'is not a valid route key.');
        
        let uri = '';
        if(ks[1].substr(0, 1) == '/') {
            uri = preUri + ks[1];
        } else {
            uri = preUri + '/' + ks[1];
        }

        switch(ks[0]) {
            case 'group':
                if(typeof v != 'object') throw new Error('parse route map faild: ' + v + 'is not a valid route value.');

                _.assign(routes, parseRoutemap(v, uri));
            break;
            case 'get':
            case 'post':
            case 'all':
                if(typeof v != 'string') throw new Error('parse route map faild: ' + v + 'is not a valid route value.');

                routes[ks[0] + ' ' + uri] = v;
            break;
            default:
                throw new Error('parse route map faild: ' + k + 'is not a valid route key.');
            break;
        }
    });

    return routes;
}

let ret = parseRoutemap(routemap, '/');
//console.log(ret);

module.exports.routes = ret;

