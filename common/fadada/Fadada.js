'use strict';

const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');
var path = require('path');
var fs = require('fs');

var fddInst;
const Fdd = function() {
    this.appId = sails.config.fadada.appId;
    this.appSecret = sails.config.fadada.appSecret;
    this.version = sails.config.fadada.version;
    this.host = sails.config.fadada.host;

    return this;
};

Fdd.create = function() {
    if(typeof fddInst == 'undefined') {
        fddInst = new Fdd();
    }
    return fddInst;
};

function sortByKey(object) {
    object = object || {};
    let ret = {};
    let keys = _.keys(object).sort();
    for(let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i];
        if(_.has(object, key)) {
            ret[key] = object[key];
        }
    }
    return ret;
}

function sortByKeyGetArr(object) {
    object = object || {};
    let ret = [];
    let keys = _.keys(object).sort();
    for(let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i];
        if(_.has(object, key)) {
            ret.push(object[key]);
        }
    }
    return ret;
}

function buildCommParams(addParams) {
    let params = {};
    addParams = addParams || {};
    let params2add = sortByKeyGetArr(addParams).join('');

    params.app_id = this.appId;
    // params.timestamp = "20190927114459";
    params.timestamp = moment().format('YYYYMMDDHHmmss');
    params.v = this.version;
    params.msg_digest = cutil.base64Encode(
        cutil.sha1(
            params.app_id +
            cutil.md5(params.timestamp).toUpperCase() +
            cutil.sha1(
                this.appSecret + params2add
            ).toUpperCase()
        ).toUpperCase()
    );

    return params;
}

function buildContractMsgParams(template_id, contract_id, tpl_parameter_map) {
    let params = {};
    let params2add = [
        template_id,
        contract_id
    ].join('');

    params.app_id = this.appId;
    // params.timestamp = "20190927114459";
    params.timestamp = moment().format('YYYYMMDDHHmmss');
    params.v = this.version;
    params.msg_digest = cutil.base64Encode(
        cutil.sha1(
            params.app_id +
            cutil.md5(params.timestamp).toUpperCase() +
            cutil.sha1(
                this.appSecret + params2add
            ).toUpperCase() +
            tpl_parameter_map
        ).toUpperCase()
    );

    return params;
}

function buildSignParams(transaction_id, customer_id) {
    let params = {};

    params.app_id = this.appId;
    // params.timestamp = "20190927114459";
    params.timestamp = moment().format('YYYYMMDDHHmmss');
    params.v = this.version;
    params.msg_digest = cutil.base64Encode(
        cutil.sha1(
            params.app_id +
            cutil.md5([transaction_id, params.timestamp].join('')).toUpperCase() +
            cutil.sha1(
                this.appSecret + customer_id
            ).toUpperCase()
        ).toUpperCase()
    );

    return params;
}

async function post(uri, params, files) {
	if(sails.config.fadada.debug) sails.log.debug("[FadafaApi] info: \nurl(post): " + this.host + uri + "\n", params);
    try {
        let result;
		if(files) {
			result = await urllib.request(this.host + uri, {
				method: 'POST',
				timeout: [5000, 30000],
				files: files,
				data: params
			});
		} else {
			result = await urllib.request(this.host + uri, {
				method: 'POST',
				timeout: [5000, 30000],
				data: params
			});
		}

        if(result.status != 200) {
            sails.log.error("[FadadaApi Request] error: ", result);
			throw result.res && result.res.statusMessage || result.status;
        }

		if(sails.config.fadada.debug) sails.log.debug("[FadafaApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));
        let code = parseInt(ret.code);
        if(
            code !== 1
            && code !== 1000
        ) {
            sails.log.error("[FadafaApi] error(" + ret.code + "): " + ret.msg);
            throw ret.msg;
        }

        //fix generate_contract.api
        if(ret.download_url) {
            ret.data = {};
            ret.data.download_url = ret.download_url
            ret.data.viewpdf_url = ret.viewpdf_url
        }

        return typeof ret.data != 'undefined' ? ret.data : true;
    } catch(err) {
        sails.log.error("[FadadaApi Request] error: ", err);
        if(err.name == 'ResponseTimeoutError') {
            throw new Error('请求法大大10s超时');
		} else if(err && err.name == 'RequestError') {
			throw flaverr('E_USER_ERROR', new Error('FadadaApi: 请求失败'));
		} else {
            throw err;
        }
    }
}



Fdd.prototype.accountReg = async function(userid, usertype) {
    let params = {
        open_id      : userid,
        account_type : usertype //1个人，2企业
    };
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'account_register.api', params);
};

//获取企业实名认证地址
Fdd.prototype.getCompVerifyUrl = async function(params) {
    //agent_info+bank_info+cert_flag+company_info+company_pri ncipal_type+customer_id+legal _info+ notify_url+page_modify+result _type+return_url+verified_way
    let defaults = {
        customer_id: "", //*客户编号
        verified_way: 0, //*实名认证套餐类型， 0：标准方案（对公打款 +纸质审核）1：对公打款 2：纸质审核,
        m_verified_way: 1, //实名认证套餐类型， 0:三要素标准方案 2:四要素标准方案。运营商三要素或者银行卡四要素是否通过都要继续人脸识别认证，1：三要素通过的情况下直接认证成功不会进行人脸识别，不通过的情况下需要进行人脸识别
        page_modify: 1, //*是否允许用户页面修改，1允许 2不允许
        notify_url: '', //*异步通知认证结果回调地址
        return_url: '', //*认证结果返回同步通知url
        company_info: { //*企业信息
            company_name: "", //企业名称
            credit_no: "", //统一社会信用代码
            credit_image_path: "" //统一社会信用代码证件照路径
        },
        bank_info: { //*对公账号信息
            bank_name: "", //银行名称
            bank_id: "", //银行帐号
            subbranch_name: "" //开户支行名称
        },
        company_principal_type: 1, //*企业负责人身份: 1. 法人 2. 代理人
        legal_info: { //*法人信息
            legal_name: "", //法人姓名
            legal_id: "", //法人证件号
            legal_mobile: "", //法人手机号(仅支持国内运营商)
            legal_id_front_path: "", //法人证件正面照下载地址
            bank_card_no: "" //法人银行卡号
        },
        agent_info: { //*代理人信息
            agent_name: "", //代理人姓名
            agent_id: "", //代理人证件号
            agent_mobile: "", //代理人手机号
            agent_id_front_path: "", //代理人证件正面照下载地址
            bank_card_no: "" //代理人银行卡号
        },
        result_type: 1, //*刷脸是否显示结果页面， 1：直接跳转到return_url或法大大指定页面， 2：需要用户点击确认后跳转到 return_url或法大大指定页面
        cert_flag: 1, //*是否认证成功后自动申请实名证书，0：不申请 1：自动申请
        option: "add", //add（新增）、 modify（修改）
        verified_serialno: "", //管理员认证流水号
        authorization_file: "", //企业注册申请表
    };

    _.defaultsDeep(params, defaults);

    _.set(params, "agent_info", JSON.stringify(sortByKey(params.agent_info)));
    _.set(params, "bank_info", JSON.stringify(sortByKey(params.bank_info)));
    _.set(params, "company_info", JSON.stringify(sortByKey(params.company_info)));
    _.set(params, "legal_info", JSON.stringify(sortByKey(params.legal_info)));

    //目前法大大只允许传递这几个参数
    let buildParams = _.pick(params, [
        "cert_flag", "company_principal_type",
        "customer_id", "notify_url", "page_modify",
        "result_type", "return_url", "verified_way",
        "agent_info", "legal_info", "bank_info", "company_info"
    ]);

    //if(params.company_principal_type == 2) { //代理人
    //    _.unset(buildParams, "legal_info");
    //    _.unset(params, "legal_info");
    //} else { //法人
    //    _.unset(buildParams, "agent_info");
    //    _.unset(params, "agent_info");
    //}

    _.assign(buildParams, buildCommParams.call(this, buildParams));

    return await post.call(this, 'get_company_verify_url.api', buildParams);
};

//获取个人实名认证地址
Fdd.prototype.getPersonVerifyUrl = async function(params) {
    let defaults = {
        customer_id: "", //*客户编号
        verified_way: 0, //*实名认证套餐类型: 0:三要素标准方案; 1:三要素补充方案; 2:四要素标准方案; 3:四要素补充方案; 4:纯三要素方案; 5:纯四要素方案; 9:人脸识别方案
        page_modify: 1, //*是否允许用户页面修改，1允许 2不允许
        notify_url: '', //*异步通知认证结果回调地址
        result_type: 1, //*刷脸是否显示结果页面， 1：直接跳转到return_url或法大大指定页面， 2：需要用户点击确认后跳转到 return_url或法大大指定页面
		cert_flag: 1, //是否认证成功后自动申 请实名证书 参数值为 “0”:不申请 参数值为“1”:自动申请
        option: "add", //add（新增）、 modify（修改）
    };

    _.defaultsDeep(params, defaults);
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'get_person_verify_url.api', params);
};

//查询企业实名认证信息
Fdd.prototype.findCompCert = async function(verified_serialno) {
    let params = {
        verified_serialno: verified_serialno //获取企业实名认证地址返回的transactionNo
    };
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'find_companyCertInfo.api', params);
/*
 {
			  authenticationSubmitTime: '2019-12-26 15:48:28.0',
				  bankCard: {
						  bankCardNo: '2121123456',
						  bankDetailName: '中国工商银行成都市双荆路支行',
						  bankName: '工商银行',
						  branchBankCode: ''
						},
				  company: {
						  auditFailReason: '',
							  auditorTime: '',
							  companyEmail: '',
							  companyName: '成都今凯科技有限公司',
							  hasagent: '1',
							  identType: 'Z',
							  isThreeCertType: 0,
							  legal: '511203198209043173',
							  legalName: '张朝云',
							  organization: '91510108MA61TPQR1H',
							  organizationPath: '8ef0dff5ab9d413e903c449d1d0f7040',
							  organizationType: '2',
							  regFormPath: '0ca1241d55744a02ad8c68572b15ff82',
							  relatedTransactionNo: 'a3e89bb17b094eac8c0bcbade230bbf7',
							  status: '3',
							  verifyType: '0'
						},
				  manager: {
						  address: '成都市青羊区中坝街29号12栋1单元15楼1503号',
							  auditFailReason: '',
							  auditorTime: '2019-12-26 03:49:58',
							  backgroundIdCardPath: '',
							  birthday: '1982-09-04',
							  expiresDate: '',
							  fork: '汉',
							  headPhotoPath: '3e344e9ec2ce4ed5871822edf496f850',
							  idCard: '511203198209043173',
							  issueAuthority: '',
							  mobile: '15578078432',
							  personName: '张朝云',
							  photoUuid: 'daa375d0381046278b681288d263eee0',
							  sex: '1',
							  startDate: '',
							  status: '2',
							  type: '2',
							  verifyType: '0'
						},
				  passTime: '',
				  transactionNo: 'cbb8d7904a064798bd816ece76413442',
				  type: '2'
		}
 */
};

//查询个人实名认证信息
Fdd.prototype.findPersonCert = async function(verified_serialno) {
    let params = {
        verified_serialno: verified_serialno //交易号，获取认证地址时返回
    };
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'find_personCertInfo.api', params);
/*
 {
			  authenticationSubmitTime: '2019-12-26 15:48:28.0',
				  bankCard: {
						  bankCardNo: '2121123456',
						  bankDetailName: '中国工商银行成都市双荆路支行',
						  bankName: '工商银行',
						  branchBankCode: ''
						},
				  company: {
						  auditFailReason: '',
							  auditorTime: '',
							  companyEmail: '',
							  companyName: '成都今凯科技有限公司',
							  hasagent: '1',
							  identType: 'Z',
							  isThreeCertType: 0,
							  legal: '511203198209043173',
							  legalName: '张朝云',
							  organization: '91510108MA61TPQR1H',
							  organizationPath: '8ef0dff5ab9d413e903c449d1d0f7040',
							  organizationType: '2',
							  regFormPath: '0ca1241d55744a02ad8c68572b15ff82',
							  relatedTransactionNo: 'a3e89bb17b094eac8c0bcbade230bbf7',
							  status: '3',
							  verifyType: '0'
						},
				  manager: {
						  address: '成都市青羊区中坝街29号12栋1单元15楼1503号',
							  auditFailReason: '',
							  auditorTime: '2019-12-26 03:49:58',
							  backgroundIdCardPath: '',
							  birthday: '1982-09-04',
							  expiresDate: '',
							  fork: '汉',
							  headPhotoPath: '3e344e9ec2ce4ed5871822edf496f850',
							  idCard: '511203198209043173',
							  issueAuthority: '',
							  mobile: '15578078432',
							  personName: '张朝云',
							  photoUuid: 'daa375d0381046278b681288d263eee0',
							  sex: '1',
							  startDate: '',
							  status: '2',
							  type: '2',
							  verifyType: '0'
						},
				  passTime: '',
				  transactionNo: 'cbb8d7904a064798bd816ece76413442',
				  type: '2'
		}
 */
};


//通过 uuid 下载文件
Fdd.prototype.getFileByUUID = async function($uuid) {
    let params = {
		uuid: $uuid
    };
    _.assign(params, buildCommParams.call(this, params));

	let $filename = moment().valueOf() + '.jpg';
	let $filepath = moment().format('YYYYMMDD');
	let $uri = '';

	if(sails.config.fadada.debug) sails.log.debug("[FadafaApi] info: \nurl(post): " + this.host + 'get_file.api' + "\n", params);
    try {
        let result = await urllib.request(this.host + 'get_file.api', {
            method: 'POST',
            timeout: [5000, 30000],
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[FadadaApi Request] error: ", result);
            throw result.statusMessage;
        }

		if(
			result.headers 
			&& result.headers['content-disposition']
			&& result.headers['content-disposition'].length > 21
		) {
			//'attachment; filename=8ef0dff5ab9d413e903c449d1d0f704020191226182336.jpg',
			let $tmpFilename = result.headers['content-disposition'].replace(' ', '').substr(20);
			$filename = $tmpFilename && $tmpFilename.length > 4 ? $tmpFilename : $filename;
		}

		var $file_uploader = new FileApi();
		$uri = path.join("fdd", $filepath, $filename);
		var $file_info = await $file_uploader.getUploadUrl($uri);
		await $file_uploader.uploadFile($file_info.url, result.data);

		$filepath = '';
		$filename = $file_info.filename;

		if(sails.config.fadada.debug) sails.log.debug("[FadafaApi] info: get File (" + $uri + ")");
    } catch(err) {
        sails.log.error("[FadadaApi Request] error: ", err);
        if(err.name == 'ResponseTimeoutError') {
            throw new Error('请求法大大10s超时');
        } else {
            throw err;
        }
    }

	return path.join($filepath, $filename);
};


//实名证书申请
Fdd.prototype.applyCompCert = async function(customer_id, verified_serialno) {
    let params = {
        customer_id: customer_id, //openid
        verified_serialno: verified_serialno //获取企业实名认证地址返回的transactionNo
    };
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'apply_cert.api', params);
};

//印章上传
Fdd.prototype.addSignature = async function(customer_id, signature_img_base64) {
    let params = {
        customer_id: customer_id, //openid
        signature_img_base64: signature_img_base64 //签章图片 base64
    };
    _.assign(params, buildCommParams.call(this, params));

    return await post.call(this, 'add_signature.api', params);
};


//合同上传
Fdd.prototype.uploadDoc = async function(contract_id, doc_title, doc_url, file) {
    let params = {
        contract_id: contract_id, //contract_id
        doc_title: doc_title, //合同标题
        doc_type: '.pdf' //文档类型
    };
    _.assign(params, buildCommParams.call(this, {contract_id: params.contract_id}));

	if(doc_url && doc_url.length) {
        params.doc_url = doc_url; //文档地址, doc_url 和 file 两个参数必选一
		file = null;
	}

    return await post.call(this, 'uploaddocs.api', params, file);
};

//模板上传
Fdd.prototype.uploadTpl = async function(template_id, doc_url, file) {
    let params = {
        template_id: template_id, //template_id
        doc_url: doc_url, //文档地址
        file: file //PDF 文档, doc_url 和 file 两个参数必选一
    };
    _.assign(params, buildCommParams.call(this, {template_id: params.template_id}));

    return await post.call(this, 'uploadtemplate.api', params);
};

//模板填充
Fdd.prototype.genContract = async function(template_id, contract_id, doc_title, parameter_map) {
    var parameter_map_s = JSON.stringify(parameter_map);
    let params = {
        doc_title: doc_title, //文档标题
        template_id: template_id, //template_id
        contract_id: contract_id, //contract_id
        font_size: 12,
        font_type: 0,
        parameter_map: parameter_map_s //填充内容{k:v,...}
    };
    _.assign(
        params,
        buildContractMsgParams.call(
            this,
            template_id,
            contract_id,
            parameter_map_s
        )
    );

    return await post.call(this, 'generate_contract.api', params);
};

//手动签署
Fdd.prototype.signContract = async function(transaction_id, contract_id, customer_id, doc_title, return_url, notify_url) {
    let params = {
        transaction_id: transaction_id, //交易号，每次请求视为一个交易
        contract_id: contract_id, //contract_id
        customer_id: customer_id,
        doc_title: doc_title, //文档标题
        // sign_keyword: "", //选填
        // keyword_strategy: 0, //选填
        return_url: return_url,
        notify_url: notify_url //选填
    };
    let pubParams = buildSignParams.call(this, transaction_id, customer_id)
    let paramStr = '';
    let isFirst = true;
    _.each(pubParams, function (v, k) {
        paramStr += isFirst ? '?' : '&';
        isFirst = false;
        paramStr += k + '=' + querystring.escape(v);
    });

    _.each(params, function (v, k) {
        paramStr += '&' + k + '=' + querystring.escape(v);
    });

    return this.host + 'extsign.api' + paramStr;
};

//合同归档
Fdd.prototype.filingContract = async function(contract_id) {
    let params = {
        contract_id: contract_id, //contract_id
    };
    _.assign(params, buildCommParams.call(this, {contract_id: params.contract_id}));

    return await post.call(this, 'contractFiling.api', params);
};

//合同查看地址
Fdd.prototype.viewContract = async function(contract_id) {
    let params = {
        contract_id: contract_id, //contract_id
    };
    _.assign(params, buildCommParams.call(this, {contract_id: params.contract_id}));
	
	return this.host + "viewContract.api?" + querystring.stringify(params);
};

//合同下载地址
Fdd.prototype.downloadContract = async function(contract_id) {
    let params = {
        contract_id: contract_id, //contract_id
    };
    _.assign(params, buildCommParams.call(this, {contract_id: params.contract_id}));
	
	return this.host + "downLoadContract.api?" + querystring.stringify(params);
};



module.exports = Fdd;

