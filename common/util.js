const fs         = require('fs');
const path       = require('path');
const moment     = require('moment');
const _          = require('lodash');
const flaverr    = require('flaverr');
const crypto     = require('crypto');
const jwt        = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const urllib     = require('urllib');

var util = function() {
    return this;
};

util.defined = function(name) {
	if(typeof name == 'undefined') return false;

	return true;
};

util.msleep = function(time = 0) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	})
};

util.getReq = function(req, paramName, def) {
    var ret = req.param(paramName);
	if(typeof ret == 'undefined') ret = def;

    try{
        ret = ret.toString().trim();
    } catch(e) {
        ret = '';
    }

    return ret;
};

util.getReqSP = function(req, $name, $type, $spliter) {
    var $ret = util.getReq(req, $name);
    $ret = $ret ? $ret.split($spliter || ',') : [];
    $ret = _.isArray($ret) && $ret || [];
    $ret = _.map($ret, $v => {
        switch($type) {
            case "string":
                $v = $v.trim();
                break;
            case "int":
            default:
                $v = parseInt($v.trim());
                $v = typeof $v == 'number' && !isNaN($v) ? $v : 0;
                break;
        }
        return $v;
    });

    return $ret;
};

util.getReqPhoto = function(req, $name, $photo_items) {
	var $ret = [];
	$photo_items = $photo_items || req.param($name);

	if(typeof $photo_items != 'undefined') {
		if(!$photo_items || !_.isArray($photo_items)) throw Error($name + '参数无效');

		_.each($photo_items, function(item) {
			var $oimg = item && item.toString().trim() || '';
			if($oimg.length < 1) throw Error($name + '参数无效');
			$ret.push($oimg);
			/*
			$oimg = item && item.oimg.toString().trim() || '';
			$lock = item && parseInt(item.lock) ? 1 : 0;
			if($oimg) {
				var $ret_row = {
					oimg: $oimg,
				};
				if($lock) $ret_row.lock = 1;
				$ret.push($ret_row);
			}
			*/
		});
	}

	return $ret;
};

util.sortDict = function(dict) {
    var dict2={}, keys = Object.keys(dict).sort();
    for (var i = 0, n = keys.length, key; i < n; ++i) {
        key = keys[i];
        dict2[key] = dict[key];
    }
    return dict2;
};

util.getTabCol = function(tab, column) {

    if(!_.isObject(tab)) throw "tab输入不是collection";

    let ret = {};
    if(_.size(tab) > 0) {
        _.each(tab, function($row){
            ret[$row[column]] = $row[column];
        });
    }

    return ret;
};

util.getTabCols = function(tab, primary_col, cols) {

    if(!_.isObject(tab)) throw "tab输入不是collection";
	if(!primary_col) throw "primary_col参数为空";
    if(!_.isArray(cols)) throw "cols参数不是数组";

	let ret = {};
	let len = cols.length;
    if(_.size(tab)) {
        _.each(tab, function($row){
			let ret_row = {};
			for(let i = 0; i < len ; i ++) {
				let k = cols[i];
				ret_row[k] = typeof $row[k] != 'undefined' ? $row[k] : '';
			}
			ret[$row[primary_col]] = ret_row;
		});
	}

    return ret;
};

util.getRowCols = function(row, cols) {

    if(!_.isObject(row)) throw "row输入不是collection";
    if(!_.isArray(cols)) throw "cols参数不是数组";

    let ret = {};
    let len = cols.length;
    for(let i = 0; i < len ; i ++) {
        let k = cols[i];
        ret[k] = typeof row[k] != 'undefined' ? row[k] : '';
    }

    return ret;
};

util.indexTabByCol = function (tab, column, column2) {
    if(!_.isObject(tab)) throw "tab输入不是collection";

    if(_.size(tab) > 0) {
        let $tmp = {};
        _.each(tab, function($row){
            if(column2) {
                if(typeof $tmp[$row[column]] == 'undefined')
                $tmp[$row[column]] = {};

                $tmp[$row[column]][$row[column2]] = $row;
            } else {
                $tmp[$row[column]] = $row;
            }
        });
        tab = $tmp;
    }

    return tab;
};

util.dbEscape = function(value, model) {
	model = model || "default";
	return sails.getDatastore(model).driver.mysql.escape(value).replace(/^'+|'+$/g, '');
};

util.tab2tree = function($flat_list, $id_col, $pid_col)
{
    $id_list = [];
    if(_.size($flat_list) > 0) {
        let $tmp = {};
        _.each($flat_list, function($row){
            $tmp[$row[$id_col]] = $row;
        });
        id_list = $tmp;
    } else {
        id_list = [];
    }

    $ret = {
        0: {'row': null, 'children': {}}
    };

    if(_.size($id_list) > 0) {
        _.each($id_list, function($row, $id){
            if(typeof $ret[$row[$pid_col]] == 'undefined')
            {
                $ret[$row[$pid_col]] = {
                    'row': $id_list[$row[$pid_col]],
                    'children': {}
                };
            }

            $ret[$row[$pid_col]]['children'][$row[$id_col]] = {
                'row': $row,
                'children': {}
            };
        });
    }

    return $ret;
};

util.camelCaseObject = function(obj) {
    var ret = {};
    _.each(obj, function(v, k) {
        let k1 = _.camelCase(k);
        ret[k1] = v;
    });
    return ret;
};

util.snakeCaseObject = function(obj) {
    var ret = {};
    _.each(obj, function(v, k) {
        let k1 = _.snakeCase(k);
        ret[k1] = v;
    });
    return ret;
};

util.isEmail = function(str) {
    return str.toLowerCase();
};

util.isMobile = function(str) {
    $mobile = str.toLowerCase();
    if($mobile.length != 11 || !/[0-9]/gi.test($mobile)) throw '请正确填写手机号';

    return $mobile;
};

util.ucan = function (userpermissions, permission) {
    if(
        typeof userpermissions[permission] != 'undefined'
        && userpermissions[permission] == permission
    ) return true;

    return false;
}

util.md5 = function(data) {
    return crypto.createHash("md5").update(data).digest("hex");
};

util.sha1 = function(data) {
    return crypto.createHash('sha1').update(data).digest('hex');
};

util.base64Encode = function(str) {
    return Buffer.from(str, 'utf8').toString('base64');
};
util.base64EncodeFile = function(pathfile) {
    if(!fs.existsSync) throw "文件不存在";
    try {
        var buff = fs.readFileSync(pathfile);
    } catch(err) {
        throw err;
    }

    buff.toString('base64');
};
util.base64Decode = function(base64str) {
    return Buffer.from(base64str, 'base64').toString('utf8');
};

util.randomUrlAlphabet = '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
util.randomFnSync = function(bytes) {
	let buffers = {}
	let buffer = buffers[bytes]
	if (!buffer) {
		// `Buffer.allocUnsafe()` is faster because it doesn’t flush the memory.
		// Memory flushing is unnecessary since the buffer allocation itself resets
		// the memory with the new bytes.
		buffer = Buffer.allocUnsafe(bytes)
		if (bytes <= 255) buffers[bytes] = buffer
	}
	return crypto.randomFillSync(buffer)
};
util.randomSync = function(size) {
	size = util.defined(size) && size != null ? size : 21;
	let bytes = util.randomFnSync(size)
	let id = ''
	// A compact alternative for `for (var i = 0; i < step; i++)`.
	while (size--) {
		// It is incorrect to use bytes exceeding the alphabet size.
		// The following mask reduces the random byte in the 0-255 value
		// range to the 0-63 value range. Therefore, adding hacks, such
		// as empty string fallback or magic numbers, is unneccessary because
		// the bitmask trims bytes down to the alphabet size.
		id += util.randomUrlAlphabet[bytes[size] & 63]
	}
	return id
};
util.randomCustomSync = function(alphabet, size) {
	// First, a bitmask is necessary to generate the ID. The bitmask makes bytes
	// values closer to the alphabet size. The bitmask calculates the closest
	// `2^31 - 1` number, which exceeds the alphabet size.
	// For example, the bitmask for the alphabet size 30 is 31 (00011111).
	let mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
	// Though, the bitmask solution is not perfect since the bytes exceeding
	// the alphabet size are refused. Therefore, to reliably generate the ID,
	// the random bytes redundancy has to be satisfied.

	// Note: every hardware random generator call is performance expensive,
	// because the system call for entropy collection takes a lot of time.
	// So, to avoid additional system calls, extra bytes are requested in advance.

	// Next, a step determines how many random bytes to generate.
	// The number of random bytes gets decided upon the ID size, mask,
	// alphabet size, and magic number 1.6 (using 1.6 peaks at performance
	// according to benchmarks).
	let step = Math.ceil((1.6 * mask * size) / alphabet.length)

	let id = ''
	while (true) {
		let bytes = util.randomFnSync(step)
		// A compact alternative for `for (var i = 0; i < step; i++)`.
		let i = step
		while (i--) {
			// Adding `|| ''` refuses a random byte that exceeds the alphabet size.
			id += alphabet[bytes[i] & mask] || ''
			// `id.length + 1 === size` is a more compact option.
			if (id.length === +size) return id
		}
	}
};

util.randomFn = async function(bytes) {
	// `crypto.randomFill()` is a little faster than `crypto.randomBytes()`,
	// because it is possible to use in combination with `Buffer.allocUnsafe()`.
	return new Promise((resolve, reject) => {
		// `Buffer.allocUnsafe()` is faster because it doesn’t flush the memory.
		// Memory flushing is unnecessary since the buffer allocation itself resets
		// the memory with the new bytes.
		crypto.randomFill(Buffer.allocUnsafe(bytes), (err, buf) => {
			if (err) {
				reject(err)
			} else {
				resolve(buf)
			}
		})
	})
};
util.random = async function(size) {
	size = util.defined(size) && size != null ? size : 21;
	return util.randomFn(size).then(bytes => {
		let id = ''
		// A compact alternative for `for (var i = 0; i < step; i++)`.
		while (size--) {
			// It is incorrect to use bytes exceeding the alphabet size.
			// The following mask reduces the random byte in the 0-255 value
			// range to the 0-63 value range. Therefore, adding hacks, such
			// as empty string fallback or magic numbers, is unneccessary because
			// the bitmask trims bytes down to the alphabet size.
			id += util.randomUrlAlphabet[bytes[size] & 63]
		}
		return id
	})
};
util.randomCustom = async function(alphabet, size) {
	// First, a bitmask is necessary to generate the ID. The bitmask makes bytes
	// values closer to the alphabet size. The bitmask calculates the closest
	// `2^31 - 1` number, which exceeds the alphabet size.
	// For example, the bitmask for the alphabet size 30 is 31 (00011111).
	let mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
	// Though, the bitmask solution is not perfect since the bytes exceeding
	// the alphabet size are refused. Therefore, to reliably generate the ID,
	// the random bytes redundancy has to be satisfied.

	// Note: every hardware random generator call is performance expensive,
	// because the system call for entropy collection takes a lot of time.
	// So, to avoid additional system calls, extra bytes are requested in advance.

	// Next, a step determines how many random bytes to generate.
	// The number of random bytes gets decided upon the ID size, mask,
	// alphabet size, and magic number 1.6 (using 1.6 peaks at performance
	// according to benchmarks).
	let step = Math.ceil((1.6 * mask * size) / alphabet.length)

	let tick = id =>
		util.randomFn(step).then(bytes => {
			// A compact alternative for `for (var i = 0; i < step; i++)`.
			let i = step
			while (i--) {
				// Adding `|| ''` refuses a random byte that exceeds the alphabet size.
				id += alphabet[bytes[i] & mask] || ''
				// `id.length + 1 === size` is a more compact option.
				if (id.length === +size) return id
			}
			return tick(id)
		})

	return tick('')
};
util.SNID = async function(size) {
	size = util.defined(size) && size != null ? size : 13;
	return util.randomCustom('0123456789abcdef', size);
};


util.signToken = function(data, expireTime) {
    let cert = fs.readFileSync(path.resolve(__dirname, '../cert/jwt.pem'));
    /*
	expiresIn:
	int default unit s
    string default unit ms
    '2 days'  // 172800000
    '1d'      // 86400000
    '10h'     // 36000000
    '2.5 hrs' // 9000000
    '2h'      // 7200000
    '1m'      // 60000
    '5s'      // 5000
    '1y'      // 31557600000
    '100'     // 100
    '-3 days' // -259200000
    '-1h'     // -3600000
    '-200'    // -200ms
    */
    return jwt.sign(data, cert,
    {
        algorithm: 'RS256',
        expiresIn: expireTime || '1d'
    });
};

util.verityToken = function(token) {
    try {
        let cert = fs.readFileSync(path.resolve(__dirname, '../cert/jwt_pub.pem'));
        var ret = jwt.verify(token, cert);
    } catch(e) {
        throw e;
    }

    return ret;
};

util.createCaptcha = function(options, expireTime) {
    var captcha = svgCaptcha.create(options);
    // {data: '<svg.../svg>', text: 'abcd'}

    var tm = moment().unix();
    captchaToken = util.md5(util.md5('sfoi*&3sf' + captcha.text.toLowerCase()) + tm) + '|' + tm;

    return {
        text: captcha.text,
        svg: captcha.data,
        token: captchaToken
    };
};

util.authCaptcha = function(code, token) {
    var tmp = token.split('|');
    if(!tmp || !_.isArray(tmp) || tmp.length != 2) return false;
    var tokenData = tmp[0].trim();
    var tm = tmp[1].trim();

    //10m过期
    if(moment().unix() - tm > 10 * 60) return false;
    if(util.md5(util.md5('sfoi*&3sf' + code.toLowerCase()) + tm) != tokenData) return false;

    return true;
}

var sms;
util.sendSMS = async function(mobiles, tplid, vars) {
    if(typeof sms == 'undefined') {
        let SendCloud = require('./sendcloud/SendCloud');
        sms = new SendCloud(
            sails.config.sendcloud.smsUser,
            sails.config.sendcloud.smsKey
            );
    }

    return sms.send(mobiles, tplid, vars);
};

util.getLogSNStr = function(req, mod) {
	return "[" + (mod || req.__sysvar && req.__sysvar.req_modname) + ": " + (req && req.__sysvar && req.__sysvar.req_srid || '-') + '@' + moment().format('YYYY-MM-DD HH:mm:ss') + "]";
};

util.post = async function(opts) {
	let $url     = opts.url || '';
	let $params  = opts.data || {};
	let $headers = opts.headers || {"Content-Type": "application/json"};
	let $files   = opts.files || null;
	let $timeout = opts.timeout || [5000, 30000];
	let $req     = opts.req || null;
	let $mod     = opts.mod || '-';
	let $debug   = opts.debug || false;

    try {
		let $request_options = {
			method  : 'POST',
			timeout : $timeout,
			followRedirect: true,
		};
		if(_.size($headers))  $request_options.headers = $headers;
		if(_.size($params))   $request_options.data    = $params;
		if(_.size($files)) {
			$request_options.files   = $files;
			delete $request_options.headers["Content-Type"];
		}

		if($debug) sails.log.debug(util.getLogSNStr($req, $mod) + " request -> POST " + $url + "\n" + JSON.stringify($request_options, null, '\t'));
        let $result = await urllib.request($url, $request_options);

        if($result.status != 200) {
            sails.log.error(util.getLogSNStr($req, $mod) + " error -> ", $result);
			throw flaverr('E_USER_ERROR', new Error($result.res && $result.res.statusMessage || $result.status));
		}

		if($debug) {
			let $log_str = '';
			if(opts.no_log_return) $log_str = '[no log data]';
			else {
				try {
					$log_str = JSON.stringify(JSON.parse($result.data.toString('utf8')), null, '\t');
				} catch($e) {
					$log_str = $result.data.toString('utf8');
				}
			}
			sails.log.debug(util.getLogSNStr($req, $mod) + " return -> \n", $log_str);
		}

        return $result.data;
    } catch($err) {
        sails.log.error(util.getLogSNStr($req, $mod) + " error -> ", $err);
        if($err.name == 'ResponseTimeoutError' || $err.name == 'ConnectionTimeoutError') {
            throw flaverr('E_USER_ERROR', new Error($mod + ': 请求超时'));
        } else if($err.name == 'RequestError') {
            throw flaverr('E_USER_ERROR', new Error($mod + ': 请求失败'));
        } else {
            throw flaverr('E_USER_ERROR', new Error($mod + ': ' + ($err.message || '未知错误')));
        }
    }
}


module.exports = util;
