var http = require("http");

var sendcloud = function(smsUser, smsKey) {
    this.smsUser = smsUser;
    this.smsKey = smsKey;
};

/*
手机号数组
发送模板id
模板变量
*/
sendcloud.prototype.send = async function(mobiles, tplid, vars) {
    let $vars = [];
    if(vars && _.size(vars)) {
        _.each(vars, function(v,k) {
            $vars.push('"%' + k + '%":"' + v + '"');
        });
    }

    let $mobiles = [];
    if(mobiles && _.size(mobiles)) {
        _.each(mobiles, function(v) {
            $mobiles.push(v);
        });
    }

    sails.log.debug(JSON.stringify($mobiles));
    if(!_.size($mobiles))  throw new Exception('需要手机号码来发送短信');

    let $param = {
        'msgType': 0,
        'smsUser': this.smsUser,
        'templateId' : tplid,
        'phone' : $mobiles.join(','),
        'vars' : '{' + $vars.join(',') + '}'
    };

    let $sorted_param = cutil.sortDict($param);

    let $param_str = "";
    for(let key in $sorted_param)
        $param_str += (key + '=' + $sorted_param[key] + '&')
    $param_str = this.smsKey + '&' + $param_str + this.smsKey;

    let $sign = cutil.md5($param_str);
    $param['signature'] = $sign.toUpperCase();


    $data = require('querystring').stringify($param);
    let $options = {
        host:"www.sendcloud.net",
        port:80,
        path:"/smsapi/send",
        method:"POST"
    };
    $options.path = $options.path + '?' + $data;
    sails.log.debug($options.path);

    return new Promise(function(resolve, reject){
        let $req = http.request($options, function(res) {
            let $responseStr = '';
            res.on('data', function (chunk) {
                $responseStr += chunk;
            });
            res.on('end', function() {
                sails.log.debug($responseStr);

                try {
                    let $response = JSON.parse($responseStr);

                    if(typeof $response != 'object' || _.size($response) < 1) {
                        reject('sendsms: 未返回数据');
                    }

                    if(parseInt($response['statusCode']) != 200)
                    {
                        reject('sendsms: 发送失败');
                    }

                    resolve($response);

                } catch (err) {
                    sails.log.error(err);
                    reject('发送失败');
                }
            });
        });
        $req.on('error', (e) => {
            reject(e.message);
        });
        $req.end();
    });
};

module.exports = sendcloud;

