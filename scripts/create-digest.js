const cutil = require('../common/util');
const _ = require('lodash');

function sortByKey(object) {
    object = object || {};
    let ret = [];
    let keys = _.keys(object).sort();
    for(let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i];

        if(_.has(object, key) && key != 'digest') {
            ret.push(object[key]);
        }
    }

    return ret;
}

function buildDigest(params, secret) {
    params = params || {};

    if(!params.appid) throw new Error('no appid');
    if(!params.timestamp) throw new Error('no timestamp');

	let $str1 = sortByKey(params).join('');
	let $str2 = secret + $str1;
	let $str3 = cutil.sha1($str2).toUpperCase();
	let $str4 = cutil.md5(params.timestamp).toUpperCase();
	let $str5 = params.appid + $str4 + $str3;
	let $str6 = cutil.sha1($str5).toUpperCase();
	let $str7 = cutil.base64Encode($str6);
	console.log('字符串1：' + $str1);
	console.log('字符串2：' + $str2);
	console.log('字符串3：' + $str3);
	console.log('字符串4：' + $str4);
	console.log('字符串5：' + $str5);
	console.log('字符串6：' + $str6);
	console.log('digest：' + $str7);
    return cutil.base64Encode(
        cutil.sha1(
            params.appid +
            cutil.md5(params.timestamp).toUpperCase() +
            cutil.sha1(
                secret + sortByKey(params).join('')
            ).toUpperCase()
        ).toUpperCase()
    );
}

let $app_id = 129;
let $app_secret = 'mc-df*05#gdi=81';
let $param = {
	appid: '129',
	digest: 'QzdGRjkwMkQ3MDBDREU4MjY4NUZGRkIxRkYwM0I4RUNCMzUyNDdCNQ==',
	timestamp: '20210309193054',
	token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNDQ3LCJpYXQiOjE2MTUyODgzMDYsImV4cCI6MTY0NjgyNDMwNn0.H1uBdaQfJuqxMrNwZZSU1UyzRLt9Hi9aiVM8gE3ZKz9Ha19KfUVVTU4mK7tsPSZK_L9kpn50UD4974PV2nGAY9z4yLMjZj2frlw3j3GpNrhK45bahxWQj5Zhdn0eYpYa4JGeYOlJD6DacyVZEh-ZMCb5b3XHp-ykJKZuG7vzauOKHr1BKCqbhRab9X51W40-r8aDoQuaSrwItxn-pESR5TLSPvSAXXtjLFuyr4Ld3ZrazFBJ6DbyWMoT2sTrYTYViAqUSb7q1V-Mb6yKEN2aH8OT-KCtgFr0eU3Rg5_oS-5dRDn7_H0ykUcumYnOf9pIbuBgbQ2xk2vjMMqSSF3ELw',
	type: 'ext',
	version: '1.0'
} 

console.log(buildDigest($param, $app_secret));
