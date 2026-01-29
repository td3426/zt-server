
const urllib = require('urllib');


async function get(uri, params, header) {
	if(sails.config.debugSpider) sails.log.debug("[spider API] info: \nurl(get): " + uri + "\n", params);
    try {
        let result = await urllib.request(uri, {
            method: 'GET',
            timeout: [5000, 30000],
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[spider Request] error: ", result);
            throw result.statusMessage;
        }

		if(sails.config.debugSpider) sails.log.debug("[spider API] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));

        return ret || '';
    } catch(err) {
        sails.log.error("[spider Request] error: ", err);
        if(err.name == 'ResponseTimeoutError') {
            throw new Error('请求spider 10s超时');
        } else {
            throw err;
        }
    }
}

async function post(uri, params, header) {
	if(sails.config.debugSpider) sails.log.debug("[spider API] info: \nurl(post): " + uri + "\n", params);
    try {
        let result = await urllib.request(uri, {
            method: 'POST',
            timeout: [5000, 30000],
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[spider Request] error: ", result);
            throw result.statusMessage;
        }

		if(sails.config.debugSpider) sails.log.debug("[spider API] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));

        return ret || '';
    } catch(err) {
        sails.log.error("[spider Request] error: ", err);
        if(err.name == 'ResponseTimeoutError') {
            throw new Error('请求spider 10s超时');
        } else {
            throw err;
        }
    }
}

const spider = function() {};

module.exports = {
	run: async function() {
		post.call(this, "https://www.qixin.com/api/search", {
			
		}, {
'Accept': 'application/json, text/plain, */*',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language: 'zh-CN,zh;q=0.9,en;q=0.8',
'b16c718576820a99d237: f5e906502b31dbc1a3ac678c65301bccf7daae2c8b49f41396b52abc4394d741771ce0da930463ef50b3b4bd48ec1b133d72c9c828ed890ae0626dfa6fdb6bad
'Connection: keep-alive
'Content-Length: 76
'Content-Type: application/json;charset=UTF-8
'Cookie: acw_tc=2f624a4615802005922012530e0544a72aa562d95de21e4dbcdb927c607cef; seo=baidu; Hm_lvt_52d64b8d3f6d42a2e416d59635df3f71=1580200727,1581050625; sid=s%3Aj86iYzpzhMX-7m6eWifDiyz9YNFrhe8I.8vqRcYN9aUbwEPyYaRsa0RkUvAkVBN%2FVgcGxrsYRFYo; Hm_lpvt_52d64b8d3f6d42a2e416d59635df3f71=1581052032
'Host: www.qixin.com
'Origin: https://www.qixin.com
'Referer: https://www.qixin.com/search?key=%E5%AE%B6%E5%85%B7%20%E7%94%B5%E5%95%86&page=241&scope[]=6
'Sec-Fetch-Mode: cors
'Sec-Fetch-Site: same-origin
'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36
'X-Requested-With: XMLHttpRequest

{"key":"家具 电商","scope":["6"],"page":241,"isFormAdvancedFilter":true}

	
		});
//https://www.qixin.com/search?key=%E5%AE%B6%E5%85%B7%20%E7%94%B5%E5%95%86&page=1&scope[]=6
//https://www.qixin.com/company/8a9761d0-ca09-4408-a74b-fa21282fd976
		
/*
 POST https://www.qixin.com/api/search

Accept: application/json, text/plain, * / *
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
b16c718576820a99d237: f5e906502b31dbc1a3ac678c65301bccf7daae2c8b49f41396b52abc4394d741771ce0da930463ef50b3b4bd48ec1b133d72c9c828ed890ae0626dfa6fdb6bad
Connection: keep-alive
Content-Length: 76
Content-Type: application/json;charset=UTF-8
Cookie: acw_tc=2f624a4615802005922012530e0544a72aa562d95de21e4dbcdb927c607cef; seo=baidu; Hm_lvt_52d64b8d3f6d42a2e416d59635df3f71=1580200727,1581050625; sid=s%3Aj86iYzpzhMX-7m6eWifDiyz9YNFrhe8I.8vqRcYN9aUbwEPyYaRsa0RkUvAkVBN%2FVgcGxrsYRFYo; Hm_lpvt_52d64b8d3f6d42a2e416d59635df3f71=1581052032
Host: www.qixin.com
Origin: https://www.qixin.com
Referer: https://www.qixin.com/search?key=%E5%AE%B6%E5%85%B7%20%E7%94%B5%E5%95%86&page=241&scope[]=6
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36
X-Requested-With: XMLHttpRequest

{"key":"家具 电商","scope":["6"],"page":241,"isFormAdvancedFilter":true}



Content-Encoding: gzip
Content-Security-Policy-Report-Only: script-src 'self' 'unsafe-eval' sitcache.qixin007.com uatcache.qixin007.com bgcdn.qixin.com zz.bdstatic.com push.zhanzhang.baidu.com s.ssl.qhres.com s6.qhres.com api.map.baidu.com *.bdimg.com hm.baidu.com hmcdn.baidu.com *.geetest.com 'nonce-6891346d-135e-41df-9d36-fdb1b9d6ff02'; object-src 'none'; report-uri /report-violation; upgrade-insecure-requests
Content-Type: application/json; charset=utf-8
Date: Fri, 07 Feb 2020 05:09:03 GMT
Etag: W/"29db-bddfqjAx3YRSsK3mhBHhbTfzHMA"
Strict-Transport-Security: max-age=15552000; includeSubDomains
Transfer-Encoding: chunked
Vary: Accept-Encoding
X-Content-Type-Options: nosniff
X-Dns-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Xss-Protection: 1; mode=block

*/
	}
};

