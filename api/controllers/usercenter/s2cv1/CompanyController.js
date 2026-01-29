const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    listBlacklists: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        var $ret_type = parseInt(cutil.getReq(req, "ret_type")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $rows = await CompBlacklist.getList($comp_id, $ret_type);

        return res.jsonok($rows);
    },

    addBlacklist: async function(req, res) {
        var $from_comp_id = req.me.compId;
        var $to_comp_id = parseInt(cutil.getReq(req, "to_comp_id")) || 0;

        if(!$from_comp_id || !$to_comp_id) return res.jsonerr('企业不存在');
        if($from_comp_id == $to_comp_id) return res.jsonerr('不能加入本公司');

        var $reasonId = parseInt(cutil.getReq(req, "reason_id")) || 0;
        var $title = cutil.getReq(req, "title") || '';
        var $desc = cutil.getReq(req, "desc") || '';

        var $cnt = await Comp.count({
            id: {
                in: [$from_comp_id, $to_comp_id]
            }
        });

        if($cnt != 2) return res.jsonerr('企业不存在');

        await CompBlacklist.create({
            fromCompId: $from_comp_id,
            toCompId: $to_comp_id,
            reasonId: $reasonId,
            title: $title,
            desc: $desc
        });

        return res.jsonok('ok');
    },

    delBlacklist: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        await CompBlacklist.destroy({
            fromCompId: req.me.compId,
            toCompId: $comp_id
        });

        return res.jsonok('ok');
    },


    listComplains: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        var $ret_type = parseInt(cutil.getReq(req, "ret_type")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $rows = await CompComplain.getList($comp_id, $ret_type);

        return res.jsonok($rows);
    },

    addComplain: async function(req, res) {
        var $from_comp_id = req.me.compId;
        var $to_comp_id = parseInt(cutil.getReq(req, "to_comp_id")) || 0;

        if(!$from_comp_id || !$to_comp_id) return res.jsonerr('企业不存在');
        if($from_comp_id == $to_comp_id) return res.jsonerr('不能加入本公司');

        var $reasonId = parseInt(cutil.getReq(req, "reason_id")) || 0;
        var $title = cutil.getReq(req, "title") || '';
        var $desc = cutil.getReq(req, "desc") || '';

        var $cnt = await Comp.count({
            id: {
                in: [$from_comp_id, $to_comp_id]
            }
        });

        if($cnt != 2) return res.jsonerr('企业不存在');

        await CompComplain.create({
            fromCompId: $from_comp_id,
            toCompId: $to_comp_id,
            reasonId: $reasonId,
            title: $title,
            desc: $desc
        });

        return res.jsonok('ok');
    },

    delComplain: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        await CompComplain.destroy({
            fromCompId: req.me.compId,
            toCompId: $comp_id
        });

        return res.jsonok('ok');
    },

    getCooperatedCompanies:  async function(req, res) {
        let retType = parseInt(cutil.getReq(req, 'ret_type')) || 0;
        let fds = ['id', 'name'];
        if(retType == 1) {
            fds = [
                "id",
                "name",
                "shortName",
                "desc",
                "photos",
                "compType",
                "compCode",
                "province",
                "city",
				"county",
				"town",
                "addr",
                "logo",
                "contactName",
                "contactPosition",
                "contactMobile",
                "certStat",
                "certMsg"
            ];
        }

        let $rows = await CompCooperated.getCooperated(req.me.compId, fds);

        let ret = {};
        _.each($rows, function($row){
            ret[$row.id] = cutil.snakeCaseObject(cutil.getRowCols($row, fds));
        });

        return res.jsonok(ret);
    },

    getAllCompanies:  async function(req, res) {
        let compType = parseInt(cutil.getReq(req, 'comp_type')) || 0;
        let retType = parseInt(cutil.getReq(req, 'ret_type')) || 0;
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

        let fds = ['id', 'name'];
        if(retType == 1) {
            fds = [
                "id",
                "name",
                "shortName",
                "desc",
                "photos",
                "compType",
                "compCode",
                "province",
                "city",
				"county",
				"town",
                "addr",
                "logo",
                "contactName",
                "contactPosition",
                "contactMobile",
                "certStat",
                "certMsg"
            ];
        }

        let $rows = await Comp.find({
            where: {
                compType: compType
            },
            select: fds,
            skip: $start,
            limit: $pagesize,
        });

        let ret = {};
        _.each($rows, function($row){
            ret[$row.id] = cutil.snakeCaseObject(cutil.getRowCols($row, fds));
        });

        return res.jsonok(ret);
    },


    getCompanyVerifiedStatByName: async function(req, res) {
        var name = cutil.getReq(req, 'name');
        if(name.length < 1) return res.jsonerr('请输入公司名称');

        var $comp_row = await Comp.findOne({
            name: name,
            certStat: [CONST.CERTIFYCATION_STAT_APLLY, CONST.CERTIFYCATION_STAT_SUCCESS]
        });

        if(!$comp_row) return res.jsonerr('公司不存在', 104);

        return res.jsonok({
            cert_stat: $comp_row.certStat
        });
    },

    getCompanyNameByCode: async function(req, res) {
        var code = parseInt(cutil.getReq(req, 'code')) || 0;
        if(!code) return res.jsonerr('请输入机构号');

        var $comp_row = await Comp.findOne({
            compCode: code
        });

        if(!$comp_row) return res.jsonerr('公司不存在');

        return res.jsonok({
            name: $comp_row.name
        });
    },

    getCompanyBaseInfo: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        //if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var ret = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
            "id",
            "compType",
            "compCode",
            "name",
            "shortName",
			"desc",
			"photos",
            "province",
            "city",
			"county",
			"town",
            "addr",
            "logo",
            "contactName",
            "contactPosition",
            "contactMobile",
			"bankIdCode",
			"bankName",
			"bankSubbranch",
            "certStat",
            "certMsg",
			"aptitude",
			"aptitudeScore",
			"aptitudeStat",
        ]));

		try {
			ret.aptitude = JSON.parse(ret.aptitude);
		} catch(e) {
			ret.aptitude = {};
		}

        return res.jsonok(ret);
    },

    getCompanyInfo: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

		try {
			$comp_row.aptitude = JSON.parse($comp_row.aptitude);
		} catch(e) {
			$comp_row.aptitude = {};
		}

		var ret = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
			"id",
			"compType",
			"compCode",
			"name",
			"shortName",
			"desc",
			"photos",
			"province",
			"city",
			"county",
			"town",
			"addr",
			"logo",
			"contactName",
			"contactPosition",
			"contactMobile",
			"creditIdCode",
			"creditImage",
			"bankIdCode",
			"bankName",
			"bankSubbranch",
			"principalType",
			"legalName",
			"legalIdCode",
			"legalIdFront",
			"legalMobile", 
			"agentName", 
			"agentIdCode", 
			"agentIdFront", 
			"agentMobile",
			"certStat",
			"certMsg",
			"fddVerifyUrl",
			"aptitude",
			"aptitudeScore",
			"aptitudeStat",
			"aptitudeMsg",
			"isInSpec",
			"isInBrandGroup"
		]));

        return res.jsonok(ret);
    },

    getNVisitedCompanyContact: async function(req, res) {
        let $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        let $channel_id = parseInt(cutil.getReq(req, "channel")) || 0;
        if(!$channel_id) return res.jsonerr('channel为空');
        if(!$comp_id) return res.jsonerr('企业不存在');

		let $ret = await StCompContactVisited.sum('cnt').where({
			compId       : $comp_id,
			whichChannel : $channel_id
		});

		return res.jsonok({
			total: $ret
		});
	},

    getCompanyContact: async function(req, res) {
        let $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        let $channel_id = parseInt(cutil.getReq(req, "channel")) || 0;
        if(!$channel_id) return res.jsonerr('channel为空');
        if(!$comp_id) return res.jsonerr('企业不存在');

        let $comp_row = await Comp.findOne({
			where: {
				id: $comp_id
			},
			select: ["id", "aptitude", "contactName", "contactMobile"]
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
		sails.log($comp_row);

		let $daytm = moment().startOf('day').valueOf();
		let $st_row = await StCompContactVisited.find({
			where: {
				dayAt        : $daytm,
				compId       : $comp_id,
				whichChannel : $channel_id
			},
			limit: 1
		});
		$st_row = _.size($st_row) && $st_row[0] || {};

		if(_.size($st_row)) {
			await sails.getDatastore().sendNativeQuery(
				"update st_company_contact_visited set cnt=cnt+1 where id=" + $st_row.id
			);
		} else {
			await StCompContactVisited.create({
				dayAt        : $daytm,
				compId       : $comp_id,
				whichChannel : $channel_id,
				cnt          : 1
			});
		}

		try {
			$comp_row.aptitude = JSON.parse($comp_row.aptitude);
		} catch(e) {
			$comp_row.aptitude = {};
		}

		if(_.size($comp_row.aptitude.contact) && _.size($comp_row.aptitude.contact.mobile)) return res.jsonok({
			from_source : 1,
			name        : $comp_row.aptitude.contact.name,
			mobile      : $comp_row.aptitude.contact.mobile
		});
		if(_.size($comp_row.contactMobile)) return res.jsonok({
			from_source : 2,
			name        : $comp_row.contactName,
			mobile      : $comp_row.contactMobile
		});

		let $user_row = await User.find({
			where: {
				compId: $comp_row.id,
				compCreator: 1
			},
			select: ['id', 'name', 'mobile']
		});
		$user_row = _.size($user_row) && $user_row[0] || {};

		if(!_.size($user_row)) return res.jsonerr('联系方式不存在');

		return res.jsonok({
			from_source : 3,
			name        : $user_row.name,
			mobile      : $user_row.mobile
		});
    },

	verifyCompany:async function(req, res) {
	    var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $set = {};

        if(typeof req.param('name') != 'undefined') {
            $set.name = cutil.getReq(req, 'name');
            if($set.name.length < 1) return res.jsonerr('请输入企业名称');
        }

        if(typeof req.param('credit_id_code') != 'undefined') {
            $set.creditIdCode = cutil.getReq(req, 'credit_id_code');
            if($set.creditIdCode.length < 1) return res.jsonerr('请输入统一社会信用代码');
        }
        if(typeof req.param('credit_image') != 'undefined') {
            $set.creditImage = cutil.getReq(req, 'credit_image');
            if($set.creditImage.length < 1) return res.jsonerr('请上传企业统一社会信用代码证件照片');
        }

        if(typeof req.param('bank_id_code') != 'undefined') {
            $set.bankIdCode = cutil.getReq(req, 'bank_id_code');
            if($set.bankIdCode.length < 1) return res.jsonerr('请输入企业银行帐号');
        }
        if(typeof req.param('bank_name') != 'undefined') {
            $set.bankName = cutil.getReq(req, 'bank_name');
            if($set.bankName.length < 1) return res.jsonerr('请输入企业开户银行名称');
        }
        if(typeof req.param('bank_subbranch') != 'undefined') {
            $set.bankSubbranch = cutil.getReq(req, 'bank_subbranch');
            if($set.bankSubbranch.length < 1) return res.jsonerr('请输入企业开户银行支行');
        }

        if(typeof req.param('legal_name') != 'undefined') {
            $set.legalName = cutil.getReq(req, 'legal_name');
            if($set.legalName.length < 1) return res.jsonerr('请输入法人姓名');
        }
        if(typeof req.param('legal_id_code') != 'undefined') {
            $set.legalIdCode = cutil.getReq(req, 'legal_id_code');
            if($set.legalIdCode.length < 1) return res.jsonerr('请输入法人身份证号码');
        }
        if(typeof req.param('legal_id_front') != 'undefined') {
            $set.legalIdFront = cutil.getReq(req, 'legal_id_front');
            if($set.legalIdFront.length < 1) return res.jsonerr('请上传法人身份证照片');
        }
        if(typeof req.param('legal_mobile') != 'undefined') {
            $set.legalMobile = cutil.getReq(req, 'legal_mobile');
            if($set.legalMobile.length < 1) return res.jsonerr('请输入法人手机号');
        }

        if(typeof req.param('agent_name') != 'undefined') {
            $set.agentName = cutil.getReq(req, 'agent_name');
            if($set.agentName.length < 1) return res.jsonerr('请输入代理人姓名');
        }
        if(typeof req.param('agent_id_code') != 'undefined') {
            $set.agentIdCode = cutil.getReq(req, 'agent_id_code');
            if($set.agentIdCode.length < 1) return res.jsonerr('请输入代理人身份证号码');
        }
        if(typeof req.param('agent_id_front') != 'undefined') {
            $set.agentIdFront = cutil.getReq(req, 'agent_id_front');
            if($set.agentIdFront.length < 1) return res.jsonerr('请上传代理人身份证照片');
        }
        if(typeof req.param('agent_mobile') != 'undefined') {
            $set.agentMobile = cutil.getReq(req, 'agent_mobile');
            if($set.agentMobile.length < 1) return res.jsonerr('请输入代理人手机号');
        }

        if(typeof req.param('principal_type') != 'undefined') {
			$set.principalType = parseInt(cutil.getReq(req, 'principal_type')) == 2 ? 2 : 1;
        }

		if(_.size($set)) {
			try {
				await sails.getDatastore().transaction(async(db, proceed) => {
					try {
						await Comp
							.update({
								id: $comp_row.id
							})
							.set($set)
							.usingConnection(db);

						return proceed(undefined, 'ok');
					} catch (err) {
						sails.log.error(err);
						return proceed(flaverr(
							'E_ERROR',
							new Error('数据写入失败')
						));
					}
				});

			} catch ($e) {
				sails.log.warn($e);
				return res.jsonerr('写入数据库失败');
			}

			$comp_row = await Comp.findOne({
				id: $comp_id
			});
			if(!$comp_row) return res.jsonerr('企业不存在');
		}


        if(sails.config.localTestMode) {
            await Comp
                .update({
                    id: $comp_row.id
                })
                .set({
                    fddOpenId: 'fddtestuser' + $comp_row.id,
                    certStat: CONST.CERTIFYCATION_STAT_APLLY,
                    certMsg: ''
                });
            return res.jsonok('ok');
        }

        var verify_option = 'add';
        //if($comp_row.certStat == CONST.CERTIFYCATION_STAT_SUCCESS) {
        //    verify_option = 'modify';
        //}

        var fdd = Fadada.create();
        try {
            //注册账号
            var fdd_openid = await fdd.accountReg(sails.config.fadada.environment + 'comp' + $comp_row.id, CONST.FADADA_ACCOUNT_TYPE_COMPANY);
            await Comp.update({
                    id: $comp_row.id
                }).set({
                    fddOpenId: fdd_openid,
                    certStat: CONST.CERTIFYCATION_STAT_APLLY,
                    certMsg: ''
                });

            //获取企业实名认证地址
            var fdd_verify_url = await fdd.getCompVerifyUrl({
                customer_id: fdd_openid, //*客户编号
                notify_url: sails.config.custom.baseUrl + sails.getUrlFor(sails.config.fadada.verifyCompanyCallback), //*异步通知认证结果回调地址
                // return_url: sails.config.custom.baseUrl + '/fdd_verify_return', //*认证结果返回同步通知url
                company_info: { //*企业信息
                    company_name: $comp_row.name, //企业名称
                    //credit_no: $comp_row.creditIdCode, //统一社会信用代码
                    //credit_image_path: $comp_row.creditImage ? (sails.config.fileApi.productImgUrl + $comp_row.creditImage) : '' //统一社会信用代码证件照路径
                },
                //bank_info: { //*对公账号信息
                //    bank_name: $comp_row.bankName, //银行名称
                //    bank_id: $comp_row.bankIdCode, //银行帐号
                //    subbranch_name: $comp_row.bankSubbranch //开户支行名称
                //},
                //legal_info: { //*法人信息
                //    legal_name: $comp_row.legalName, //法人姓名
                //    legal_id: $comp_row.legalIdCode, //法人证件号
                //    legal_mobile: $comp_row.legalMobile, //法人手机号(仅支持国内运营商)
                //    legal_id_front_path: $comp_row.legalIdFront ? (sails.config.fileApi.productImgUrl + $comp_row.legalIdFront) : '', //法人证件正面照下载地址
                //},
                //agent_info: { //*代理人信息
                //    agent_name: $comp_row.agentName, //代理人姓名
                //    agent_id: $comp_row.agentIdCode, //代理人证件号
                //    agent_mobile: $comp_row.agentMobile, //代理人手机号(仅支持国内运营商)
                //    agent_id_front_path: $comp_row.agentIdFront ? (sails.config.fileApi.productImgUrl + $comp_row.agentIdFront) : '', //代理人证件正面照下载地址
                //},
				company_principal_type: $comp_row.principalType, //企业负责人身份
                option: verify_option
            });

            let url = cutil.base64Decode(fdd_verify_url.url);
            let transactionNo = fdd_verify_url.transactionNo;
            await Comp.update({
                    id: $comp_row.id
                }).set({
                    fddVerifyUrl: url,
					fddVerifyTransactionNo: transactionNo,
					certStat: CONST.CERTIFYCATION_STAT_APLLY,
					certMsg: ''
                });

            return res.jsonok({
                verify_url: url
            });

        } catch(err) {
            sails.log.warn(err);

            let $errmsg = _.isString(err) ? err : err.message;

            await Comp
                .update({
                    id: $comp_row.id
                })
                .set({
                    certStat: CONST.CERTIFYCATION_STAT_FAILED,
                    certMsg: $errmsg
                });

            return res.jsonerr('认证失败: ' + $errmsg);
        }
	},

    updateCompanyInfo: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $set = {};

        //if(typeof req.param('name') != 'undefined') {
        //    $set.name = cutil.getReq(req, 'name');
        //    if($set.name.length < 1) return res.jsonerr('请输入企业名称');
        //}
		
        if(typeof req.param('short_name') != 'undefined') {
            $set.shortName = cutil.getReq(req, 'short_name');
        }

        if(typeof req.param('desc') != 'undefined') {
            $set.desc = cutil.getReq(req, 'desc');
        }

        if(typeof req.param('photos') != 'undefined') {
            $set.photos = cutil.getReq(req, 'photos');
        }

        if(typeof req.param('logo') != 'undefined') {
            $set.logo = cutil.getReq(req, 'logo');
        }

        //if(typeof req.param('credit_id_code') != 'undefined') {
        //    $set.creditIdCode = cutil.getReq(req, 'credit_id_code');
        //    if($set.creditIdCode.length < 1) return res.jsonerr('请输入统一社会信用代码');
        //}
        //if(typeof req.param('credit_image') != 'undefined') {
        //    $set.creditImage = cutil.getReq(req, 'credit_image');
        //    if($set.creditImage.length < 1) return res.jsonerr('请上传企业统一社会信用代码证件照片');
        //}

        //if(typeof req.param('bank_id_code') != 'undefined') {
        //    $set.bankIdCode = cutil.getReq(req, 'bank_id_code');
        //    if($set.bankIdCode.length < 1) return res.jsonerr('请输入企业银行帐号');
        //}
        //if(typeof req.param('bank_name') != 'undefined') {
        //    $set.bankName = cutil.getReq(req, 'bank_name');
        //    if($set.bankName.length < 1) return res.jsonerr('请输入企业开户银行名称');
        //}
        //if(typeof req.param('bank_subbranch') != 'undefined') {
        //    $set.bankSubbranch = cutil.getReq(req, 'bank_subbranch');
        //    if($set.bankSubbranch.length < 1) return res.jsonerr('请输入企业开户银行支行');
        //}

        //if(typeof req.param('legal_name') != 'undefined') {
        //    $set.legalName = cutil.getReq(req, 'legal_name');
        //    if($set.legalName.length < 1) return res.jsonerr('请输入法人姓名');
        //}
        //if(typeof req.param('legal_id_code') != 'undefined') {
        //    $set.legalIdCode = cutil.getReq(req, 'legal_id_code');
        //    if($set.legalIdCode.length < 1) return res.jsonerr('请输入法人身份证号码');
        //}
        //if(typeof req.param('legal_id_front') != 'undefined') {
        //    $set.legalIdFront = cutil.getReq(req, 'legal_id_front');
        //    if($set.legalIdFront.length < 1) return res.jsonerr('请上传法人身份证照片');
        //}
        //if(typeof req.param('legal_mobile') != 'undefined') {
        //    $set.legalMobile = cutil.getReq(req, 'legal_mobile');
        //    if($set.legalMobile.length < 1) return res.jsonerr('请输入法人手机号');
        //}

        //if(typeof req.param('agent_name') != 'undefined') {
        //    $set.agentName = cutil.getReq(req, 'agent_name');
        //    if($set.agentName.length < 1) return res.jsonerr('请输入代理人姓名');
        //}
        //if(typeof req.param('agent_id_code') != 'undefined') {
        //    $set.agentIdCode = cutil.getReq(req, 'agent_id_code');
        //    if($set.agentIdCode.length < 1) return res.jsonerr('请输入代理人身份证号码');
        //}
        //if(typeof req.param('agent_id_front') != 'undefined') {
        //    $set.agentIdFront = cutil.getReq(req, 'agent_id_front');
        //    if($set.agentIdFront.length < 1) return res.jsonerr('请上传代理人身份证照片');
        //}
        //if(typeof req.param('agent_mobile') != 'undefined') {
        //    $set.agentMobile = cutil.getReq(req, 'agent_mobile');
        //    if($set.agentMobile.length < 1) return res.jsonerr('请输入代理人手机号');
        //}

        //if(typeof req.param('principal_type') != 'undefined') {
		//	$set.principalType = parseInt(cutil.getReq(req, 'principal_type')) == 2 ? 2 : 1;
        //}

        if(typeof req.param('province') != 'undefined') {
            $set.province = cutil.getReq(req, 'province');
        }
        if(typeof req.param('city') != 'undefined') {
            $set.city = cutil.getReq(req, 'city');
        }
        if(typeof req.param('county') != 'undefined') {
            $set.county = cutil.getReq(req, 'county');
        }
        if(typeof req.param('town') != 'undefined') {
            $set.town = cutil.getReq(req, 'town');
        }
        if(typeof req.param('addr') != 'undefined') {
            $set.addr = cutil.getReq(req, 'addr');
        }

        if(typeof req.param('contact_name') != 'undefined') {
            $set.contactName = cutil.getReq(req, 'contact_name');
        }
        if(typeof req.param('contact_position') != 'undefined') {
            $set.contactPosition = cutil.getReq(req, 'contact_position');
        }
        if(typeof req.param('contact_mobile') != 'undefined') {
            $set.contactMobile = cutil.getReq(req, 'contact_mobile');
        }

        if(!_.size($set)) return res.jsonerr('请填写要修改的信息');

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					$comp_row = await Comp.update({
						id: $comp_row.id
					}).set($set).fetch().usingConnection(db);
					$comp_row = _.size($comp_row) && $comp_row[0] || {};

                    return proceed(undefined, 'ok');
                } catch (err) {
                    sails.log.error(err);
                    return proceed(flaverr(
                        'E_ERROR',
                        new Error('数据写入失败')
                    ));
                }
            });
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }

		try {
			const mq = new MqApi(req);
			mq.notifyUpdateComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}

        return res.jsonok('ok');
    },


    //实名认证异步回调
	fddVerifyNotify: async function(req, res) {
		var $params = req.allParams();
		/*
		{   appId: '402509',
			customerId: '5000288E4B7FAE80DD5ABE4C735B3526',
			status: '3',
			serialNo: '2f3662ba53734ffb9926b0ee9e70fd40',
			statusDesc: '',
			certStatus: '0'
		}
		*/

		if(!$params.appId || $params.appId != sails.config.fadada.appId) {
			sails.log.error('[fadada API fddVerifyNotify]: appId不一致: \n', $params);
			return res.jsonok('ok');
		}

		if(!$params.customerId) {
			sails.log.error('[fadada API fddVerifyNotify]: 未找到fddOpenId: \n', $params);
			return res.jsonok('ok');
		}

		var $comp_row = await Comp.findOne({
			fddOpenId: $params.customerId
		});

		if(!$comp_row || !$comp_row.id) {
			sails.log.error('[fadada API fddVerifyNotify]: 未找到数据记录: \n', $params);
			return res.jsonok('ok');
		}

		if($comp_row.certStat == CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonok('ok');

		/*
		个人:Status: 0:未激活; 1:未认证; 2:审核通过; 3:已提交待审核; 4:审核不通过
		企业:status: 0:未认证; 1:管理员资料已提交; 2:企业基本资料(没有申请表)已提交; 3:已提交待审核; 4:审核通过; 5:审核不通过; 6 人工初审通过
		*/
		var $status = CONST.CERTIFYCATION_STAT_APLLY;
		var $errmsg = '';
		switch(parseInt($params.status)) {
			case 0: //未认证
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '未认证';
				break;
			case 1: //管理员资料已提交
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '管理员资料已提交';
				break;
			case 2: //企业基本资料(没有申请表)已提交
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '企业基本资料(没有申请表)已提交';
				break;
			case 3: //已提交待审核
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '已提交待审核';
				break;
			case 4: //审核通过
				$status = CONST.CERTIFYCATION_STAT_SUCCESS;
				$errmsg = '审核通过';
				break;
			case 5: //审核不通过
				$status = CONST.CERTIFYCATION_STAT_FAILED;
				$errmsg = '审核不通过';
				break;
			case 6: //人工初审通过
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '人工初审通过';
				break;
		}

		var $set = {
			certStat: $status,
			certMsg: $params.statusDesc ? $params.statusDesc : $errmsg
		};

		if(!sails.config.localTestMode) {
			var fdd = Fadada.create();
			var $fddCompRow = await fdd.findCompCert($comp_row.fddVerifyTransactionNo);
			if(
				$fddCompRow 
				&& $fddCompRow.transactionNo == $comp_row.fddVerifyTransactionNo
				&& parseInt($fddCompRow.type) == 2
			) {
				let $imgs = {};

				$set.bankName        = $fddCompRow.bankCard && $fddCompRow.bankCard.bankName || '';
				$set.bankIdCode      = $fddCompRow.bankCard && $fddCompRow.bankCard.bankCardNo || '';
				$set.bankSubbranch   = $fddCompRow.bankCard && $fddCompRow.bankCard.bankDetailName || '';

				$set.name            = $fddCompRow.company && $fddCompRow.company.companyName || '';
				$set.creditIdCode    = $fddCompRow.company && $fddCompRow.company.organization || '';
				$set.creditImage     = $fddCompRow.company && $fddCompRow.company.organizationPath || '';
				$imgs['creditImage'] = $fddCompRow.company && $fddCompRow.company.organizationPath || '';

				$set.legalIdCode     = $fddCompRow.company && $fddCompRow.company.legal || '';
				$set.legalName       = $fddCompRow.company && $fddCompRow.company.legalName || '';

				let $principalType = parseInt($fddCompRow.manager.type);
				if($principalType == 2) {
					$set.principalType    = $principalType;
					$set.agentName        = $fddCompRow.manager && $fddCompRow.manager.personName || '';
					$set.agentIdCode      = $fddCompRow.manager && $fddCompRow.manager.idCard || '';
					$set.agentIdFront     = $fddCompRow.manager && $fddCompRow.manager.headPhotoPath || '';
					$imgs['agentIdFront'] = $fddCompRow.manager && $fddCompRow.manager.headPhotoPath || '';
					$set.agentMobile      = $fddCompRow.manager && $fddCompRow.manager.mobile || '';
				} else if($principalType == 1) {
					$set.principalType    = $principalType;
					$set.legalName        = $fddCompRow.manager && $fddCompRow.manager.personName || '';
					$set.legalIdCode      = $fddCompRow.manager && $fddCompRow.manager.idCard || '';
					$set.legalIdFront     = $fddCompRow.manager && $fddCompRow.manager.headPhotoPath || '';
					$imgs['legalIdFront'] = $fddCompRow.manager && $fddCompRow.manager.headPhotoPath || '';
					$set.legalMobile      = $fddCompRow.manager && $fddCompRow.manager.mobile || '';
				}

				var fdd = Fadada.create();
				for(let k in $imgs) {
					let $fdName = k;
					let $imgUUID = $imgs[k];
					try {
						$set[$fdName] = await fdd.getFileByUUID($imgUUID);
					} catch($e) {}
				}
			}
		}

		$comp_row = await Comp.update({
			id: $comp_row.id
		}).set($set).fetch();
		$comp_row = _.size($comp_row) && $comp_row[0] || {};

		try {
			const mq = new MqApi(req);
			mq.notifyUpdateComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}


		//todo: 申请证书
		if(!parseInt($params.certStatus)) {}

		return res.jsonok('ok');
	},

    //实名认证同步回调
	fddVerifyReturn: async function(req, res) {
		return res.ok('未启用同步回调');

		var $params = req.allParams();
		sails.log.debug('fddVerifyReturn: ', $params);

		/*
		{   companyName: '上海家具设计有限公司',
			transactionNo: '1add474a86084bc9ad8c2e01f4686bd7',
			authenticationType: '2',
			status: '0',
			sign: 'NThGNDRDQTNGN0EwOTU5N0E4M0E3NTI4RUU2OTlEQkQ0MDg1MjRGQg=='
		}
		*/

		var $errmsg = '';
		var $companyName = $params.companyName;
		if(parseInt($params.authenticationType) == CONST.FADADA_ACCOUNT_TYPE_COMPANY) {
			var $comp_row = await Comp.findOne({
				fddVerifyTransactionNo: $params.transactionNo
			});

			if(!$comp_row || !$comp_row.id) {
				sails.log.error('fddVerifyReturn未找到交易号: \n', $params);
				return res.ok('未找到交易号: ' + $params.transactionNo);
			}

			/*
			个人:Status: 0:未激活; 1:未认证; 2:审核通过; 3:已提交待审核; 4:审核不通过
			企业:status: 0:未认证; 1:管理员资料已提交; 2:企业基本资料(没有申请表)已提交; 3:已提交待审核; 4:审核通过; 5:审核不通过; 6 人工初审通过
			*/
			var $status = CONST.CERTIFYCATION_STAT_APLLY;
			switch(parseInt($params.status)) {
				case 0: //未认证
					$status = CONST.CERTIFYCATION_STAT_APLLY;
					$errmsg = '未认证';
					break;
				case 1: //管理员资料已提交
					$status = CONST.CERTIFYCATION_STAT_APLLY;
					$errmsg = '管理员资料已提交';
					break;
				case 2: //企业基本资料(没有申请表)已提交
					$status = CONST.CERTIFYCATION_STAT_APLLY;
					$errmsg = '企业基本资料(没有申请表)已提交';
					break;
				case 3: //已提交待审核
					$status = CONST.CERTIFYCATION_STAT_APLLY;
					$errmsg = '已提交待审核';
					break;
				case 4: //审核通过
					$status = CONST.CERTIFYCATION_STAT_SUCCESS;
					$errmsg = '审核通过';
					break;
				case 5: //审核不通过
					$status = CONST.CERTIFYCATION_STAT_FAILED;
					$errmsg = '审核不通过';
					break;
				case 6: //人工初审通过
					$status = CONST.CERTIFYCATION_STAT_APLLY;
					$errmsg = '人工初审通过';
					break;
			}
			await Comp
				.update({
					id: $comp_row.id
				})
				.set({
					certStat: $status,
					certMsg: $errmsg
				});
		}

		return res.ok($companyName + ': ' + $errmsg);
	},


	verifyAptitudeFactory: async function(req, res) {
	    let $comp_id = req.me.compId;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
		if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('非工厂企业');

        let $set = {
			ability_service: { //服务能力
				jgsx: [], //加工属性
				mczl: [], //主要加工木材种类
				zdcp: [], //主打产品
				wx: [], //外协
				fwbq: [], //服务标签
			},
			stat: { //工厂现状
				n_employee: 0, //总人数
				reg_date: 0, //成立时间
				area: 0, //工厂面积，平米
				amount: 0, //总产值，万
				n_equipment: 0, //生产设备，台
				zone: 0, //所在区域
				photo: [], //照片
				video: [], //视频
				intro: '' //简介
			},
			relation: { //相关资料
				honor: [], //荣誉
				iso: [], //质量认证
				site: '', //网站
			},
			ability_make: [], //工艺能力
			real_check: { //实地认证
				stat: 0, //实地认证状态，0未认证，1已认证
				expired_at: 0 //到期日
			},
			contact: {
				name: '',
				mobile: ''
			}
		};
		let $index_set = {};

		let item = null;
		try {
			item = $comp_row.aptitude ? JSON.parse($comp_row.aptitude) : null;
			if(item && _.size(item)) $set = item;
		} catch(e) {}

		let $contact = req.param('contact');
		$set.contact = {
			name   : _.size($contact) && _.size($contact.name) && $contact.name || '',
			mobile : _.size($contact) && _.size($contact.mobile) && $contact.mobile || ''
		};

		//服务能力
		let $ability_service = req.param('ability_service');
		if(!_.size($ability_service)) return res.jsonerr('请填写服务能力相关信息');

		//加工属性
		if(!_.isArray($ability_service.jgsx) || !_.size($ability_service.jgsx)) return res.jsonerr('请选择加工属性');
		item = $ability_service.jgsx;
		$set.ability_service.jgsx = [];
		$index_set.jgsx = [];
		_.each(item, function(it) {
			if(!it.k || typeof it.v == 'undefined') return true;
			$set.ability_service.jgsx.push(it);
			$index_set.jgsx.push(it.k);
		});
		$index_set.jgsx = _.size($index_set.jgsx) ? (',' + $index_set.jgsx.join(',') + ',') : '';

		//主要加工木材种类
		if(!_.isArray($ability_service.mczl) || !_.size($ability_service.mczl)) return res.jsonerr('请选择主要加工木材种类');
		item = $ability_service.mczl;
		$set.ability_service.mczl = [];
		$index_set.mczl = [];
		_.each(item, function(it) {
			if(!it.k || typeof it.v == 'undefined') return true;
			$set.ability_service.mczl.push(it);
			$index_set.mczl.push(it.k);
		});
		$index_set.mczl = _.size($index_set.mczl) ? (',' + $index_set.mczl.join(',') + ',') : '';

		//主打产品
		if(!_.isArray($ability_service.zdcp) || !_.size($ability_service.zdcp)) return res.jsonerr('请选择主打产品');
		item = $ability_service.zdcp;
		$set.ability_service.zdcp = [];
		$index_set.zdcp = [];
		_.each(item, function(it) {
			if(!it.k || typeof it.v == 'undefined') return true;
			$set.ability_service.zdcp.push(it);
			$index_set.zdcp.push(it.k);
		});
		$index_set.zdcp = ',' + $index_set.zdcp.join(',') + ',';

		//外协
		if($ability_service.wx) {
			item = $ability_service.wx;
			$set.ability_service.wx = [];

			if(_.isArray(item) && _.size(item)) {
				_.each(item, function(it) {
					if(!it.k || typeof it.v == 'undefined') return true;
					$set.ability_service.wx.push(it);
				});
			}
		}

		//服务标签
		if(!_.isArray($ability_service.fwbq) || !_.size($ability_service.fwbq)) return res.jsonerr('请选择服务标签');
		item = $ability_service.fwbq
		$set.ability_service.fwbq = []; 
		_.each(item, function(it) {
			if(!it.k || typeof it.v == 'undefined') return true;
			$set.ability_service.fwbq.push(it);
		});


		//工厂现状
		let $stat = req.param('stat');
		if(!_.size($stat)) return res.jsonerr('请填写公司现状相关字段');

		//总人数，0表示未选择，1表示1-20人、2表示21-50人、3表示51-100人、4表示101-200人、5表示201-500人、6表示501-1000人、7表示1001人以上
		$set.stat.n_employee = parseInt($stat.n_employee) || 0; //总人数
		if(!$set.stat.n_employee) return res.jsonerr('请选择总人数');
		$index_set.nEmployee = $set.stat.n_employee;
	
		$stat.reg_date = Number($stat.reg_date) || 0;
		let reg_date = moment($stat.reg_date); //成立时间，ms
		if(!reg_date.isValid) return res.jsonerr('请填写成立日期');
		$index_set.regDate = $set.stat.reg_date = reg_date.valueOf();

		$set.stat.area = parseInt($stat.area) || 0; //工厂面积
		if(!$set.stat.area) return res.jsonerr('请填写工厂面积');

		$set.stat.amount = parseInt($stat.amount) || 0; //总产值
		//if(!$set.stat.amount) return res.jsonerr('请填写总产值');

		$set.stat.n_equipment = parseInt($stat.n_equipment) || 0; //生产设备
		if(!$set.stat.n_equipment) return res.jsonerr('请填写生产设备');

		$set.stat.zone = parseInt($stat.zone) || 0; //区域
		if($set.stat.zone && !await DictCompZone.count({id: $set.stat.zone})) return res.jsonerr('请选择区域');
		$index_set.zoneId = $set.stat.zone;

		//照片
		if(!_.isArray($stat.photo) || !_.size($stat.photo)) return res.jsonerr('请上传工厂图片');
		item = $stat.photo;
		$set.stat.photo = [];
		_.each(item, function(it) {
			it = it.toString().trim();
			if(it.length) {
				$set.stat.photo.push(it);
			}
		});

				//视频
				if($stat.video) {
					item = $stat.video;
					$set.stat.video = [];

					if(_.isArray(item) && _.size(item)) {
						_.each(item, function(it) {
							it = it.toString().trim();
							if(it.length) {
								$set.stat.video.push(it);
							}
						});
					}
				}

		//简介
		if($stat.intro) {
			$set.stat.intro = $stat.intro;
		}
	
		//相关资料
		if(typeof req.param('relation') != 'undefined') {
			let $relation = req.param('relation');
			//荣誉
			if($relation.honor) {
				item = $relation.honor;
				$set.relation.honor = [];

				if(_.isArray(item) && _.size(item)) {
					_.each(item, function(it) {
						it = it.toString().trim();
						if(it.length) {
							$set.relation.honor.push(it);
						}
					});
				}
			}

			//iso
			if($relation.iso) {
				item = $relation.iso;
				$set.relation.iso = [];

				if(_.isArray(item) && _.size(item)) {
					_.each(item, function(it) {
						it = it.toString().trim();
						if(it.length) {
							$set.relation.iso.push(it);
						}
					});
				}
			}

			//网站
			if($relation.site) {
				$set.relation.site = $relation.site;
			}
		}

		//工艺能力
		if(typeof req.param('ability_make') != 'undefined') {
			let item = req.param('ability_make');
			$set.ability_make = [];
			$index_set.abilityMake = [];

			if(_.isArray(item) && _.size(item)) {
				_.each(item, function(it) {
					if(!it.id) return true;
					$set.ability_make.push(it);
					$index_set.abilityMake.push(it.id);
				});
			}
			$index_set.abilityMake = _.size($index_set.abilityMake) ? (',' + $index_set.abilityMake.join(',') + ',') : '';
		}

		//实地认证，当前默认已认证
		$set.real_check.expired_at = moment().valueOf() + 1000 * 86400 * 365;
		$set.real_check.stat = $index_set.realCheckStat = 1;

		let $row = {
			aptitude: JSON.stringify($set),
			aptitudeScore: 0
		};

		if(
			_.size($set.ability_service.jgsx) || 
			_.size($set.ability_service.mczl) || 
			_.size($set.ability_service.zdcp) || 
			_.size($set.ability_service.wx)   || 
			_.size($set.ability_service.fwbq)
		) $row.aptitudeScore += 25;

		if(_.size($set.ability_service.fwbq) > 8) {
			return res.jsonerr('标签最多8个');
		}

		if(
			$set.stat.n_employee    ||
			$set.stat.reg_date      ||
			$set.stat.area          ||
			$set.stat.amount        ||
			$set.stat.n_equipment   ||
			$set.stat.province      ||
			$set.stat.city          ||
			$set.stat.zone          ||
			$set.stat.addr          ||
			_.size($set.stat.photo) ||
			$set.stat.intro
		) $row.aptitudeScore += 25;

		if(
			_.size($set.relation.honor) ||
			_.size($set.relation.iso)   ||
			$set.relation.site.length
		) $row.aptitudeScore += 25;

		if(_.size($set.ability_make)) $row.aptitudeScore += 25;

		$row.aptitudeStat = CONST.APTITUDE_STAT_SUCCESS;
		$row.aptitudeMsg = '';

		let $o_index_set = {};
		$o_index_set.gc_aptitude_jgsx            = $index_set.jgsx;
		$o_index_set.gc_aptitude_mczl            = $index_set.mczl;
		$o_index_set.gc_aptitude_zdcp            = $index_set.zdcp;
		$o_index_set.aptitude_n_employee         = $index_set.nEmployee;
		$o_index_set.aptitude_reg_date           = $index_set.regDate;
		$o_index_set.gc_aptitude_zone            = $index_set.zoneId;
		$o_index_set.gc_aptitude_ability_make    = $index_set.abilityMake;
		$o_index_set.gc_aptitude_real_check_stat = $index_set.realCheckStat;
		$o_index_set.compType                    = $comp_row.compType;

		try {
			await sails.getDatastore('default').transaction(async (db, proceed) => {
				try {
					$comp_row = await Comp.update({id: $comp_id}).set($row).fetch().usingConnection(db);
					$comp_row = _.size($comp_row) && $comp_row[0] || {};

					if(await IndexFactoryAptitude.count({
						id: $comp_id
					}).usingConnection(db)) {
						await IndexFactoryAptitude.update({id: $comp_id}).set($index_set).usingConnection(db);
					} else {
						$index_set.id = $comp_id;
						await IndexFactoryAptitude.create($index_set).usingConnection(db);
					}

					if(await CompAptitudeIndex.count({
						id: $comp_id
					}).usingConnection(db)) {
						await CompAptitudeIndex.update({id: $comp_id}).set($o_index_set).usingConnection(db);
					} else {
						$o_index_set.id = $comp_id;
						await CompAptitudeIndex.create($o_index_set).usingConnection(db);
					}

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			const mq = new MqApi(req);
			mq.notifyUpdateComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	verifyAptitudeDesignComp: async function(req, res) {
		let $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('企业不存在');

        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
		if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('非设计公司');

        let $set = {
			ability_service: { //服务能力
				range: [] //服务范围
			},
			stat: { //公司现状
				n_employee: 0,
				reg_date: 0,
				intro: ''
			},
			case: [], //历史案例
			brand: [], //品牌历程
			team: [], //团队展示
			prize: [], //奖项证书
			relationship: [] //合作伙伴
		};
		let $index_set = {};

		let item = null;
		try {
			item = $comp_row.aptitude ? JSON.parse($comp_row.aptitude) : null;
			if(item && _.size(item)) $set = item;
		} catch(e) {}


		let $contact = req.param('contact');
		$set.contact = {
			name   : _.size($contact) && _.size($contact.name) && $contact.name || '',
			mobile : _.size($contact) && _.size($contact.mobile) && $contact.mobile || ''
		};


		//服务能力
		//服务范围
		var $ability_service = req.param('ability_service');
		if(!_.size($ability_service) || !_.size($ability_service.range)) return res.jsonerr('请选择服务范围');
		item = $ability_service.range;
		$set.ability_service.range = [];
		$index_set.range = [];
		_.each(item, function(it) {
			if(!it.k || typeof it.v == 'undefined') return true;
			$set.ability_service.range.push(it);
			$index_set.range.push(it.k);
		});
		$index_set.range = _.size($index_set.range) ? (',' + $index_set.range.join(',') + ',') : '';

		//公司现状
		var $stat = req.param('stat');
		//总人数，0表示未选择，1表示1-20人、2表示21-50人、3表示51-100人、4表示101-200人、5表示201-500人、6表示501-1000人、7表示1001人以上
		$set.stat.n_employee = parseInt($stat.n_employee) || 0; //总人数
		if(!$set.stat.n_employee) return res.jsonerr('请选择总人数');
		$index_set.nEmployee = $set.stat.n_employee;

		$stat.reg_date = Number($stat.reg_date) || 0;
		let reg_date = moment($stat.reg_date); //成立时间，ms
		if(!reg_date.isValid) return res.jsonerr('请填写成立日期');
		$index_set.regDate = $set.stat.reg_date = reg_date.valueOf();

		//简介
		if($stat.intro) {
			$set.stat.intro = $stat.intro.toString() || '';
		}

		//历史案例
		item = req.param('case');
		if(!_.isArray(item) || !_.size(item)) return res.jsonerr('请填写案例展示');
		$set.case = [];
		$index_set.nCase = 0;
		_.each(item, function(it) {
			it.name = it.name && it.name.toString().trim() || '';
			it.intro = it.intro && it.intro.toString().trim() || '';
			var it_photo = [];
			if(it.photo) {
				_.each(it.photo, function(p) {
					p = p.toString().trim();
					if(p.length) it_photo.push(p);
				});
			}
			it.photo = it_photo;
			$set.case.push(it);
			$index_set.nCase ++;
		});

		//品牌历程
		item = req.param('brand');
		if(_.isArray(item) && _.size(item)) {
			$set.brand = [];
			_.each(item, function(it) {
				it.date = it.date && it.date.toString().trim() || '';
				it.intro = it.intro && it.intro.toString().trim() || '';
				var it_photo = [];
				if(it.photo) {
					_.each(it.photo, function(p) {
						p = p.toString().trim();
						if(p.length) it_photo.push(p);
					});
				}
				it.photo = it_photo;
				$set.brand.push(it);
			});
		}

		//团队展示
		item = req.param('team');
		if(_.isArray(item) && _.size(item)) {
			$set.team = [];
			_.each(item, function(it) {
				it.name = it.name && it.name.toString().trim() || '';
				it.intro = it.intro && it.intro.toString().trim() || '';
				var it_photo = [];
				if(it.photo) {
					_.each(it.photo, function(p) {
						p = p.toString().trim();
						if(p.length) it_photo.push(p);
					});
				}
				it.photo = it_photo;
				$set.team.push(it);
			});
		}

		//奖项证书
		item = req.param('prize');
		$index_set.nPrize = 0;
		if(_.isArray(item) && _.size(item)) {
			$set.prize = [];
			_.each(item, function(it) {
				$set.prize.push(it);
				$index_set.nPrize ++;
			});
		}

		//合作伙伴
		item = req.param('relationship');
		if(_.isArray(item) && _.size(item)) {
			$set.relationship = [];
			_.each(item, function(it) {
				$set.relationship.push(it);
			});
		}

		var $row = {
			aptitude: JSON.stringify($set),
			aptitudeScore: 0
		};

		if(_.size($set.ability_service.range)) $row.aptitudeScore += 14;
		if($set.stat.nEmployee || $set.stat.reg_date || $set.stat.intro) $row.aptitudeScore += 14;
		if(_.size($set.case)) $row.aptitudeScore += 14;
		if(_.size($set.brand)) $row.aptitudeScore += 14;
		if(_.size($set.team)) $row.aptitudeScore += 14;
		if(_.size($set.prize)) $row.aptitudeScore += 14;
		if(_.size($set.relationship)) $row.aptitudeScore += 14;
		if($row.aptitudeScore >= 98) $row.aptitudeScore = 100;

		$row.aptitudeStat = CONST.APTITUDE_STAT_SUCCESS;
		$row.aptitudeMsg = '';

		let $o_index_set = {};
		$o_index_set.sj_aptitude_range   = $index_set.range;
		$o_index_set.aptitude_n_employee = $index_set.nEmployee;
		$o_index_set.aptitude_reg_date   = $index_set.regDate;
		$o_index_set.sj_aptitude_n_case  = $index_set.nCase;
		$o_index_set.sj_aptitude_n_prize = $index_set.nPrize;
		$o_index_set.compType            = $comp_row.compType;

		try {
			await sails.getDatastore('default').transaction(async (db, proceed) => {
				try {
					$comp_row = await Comp.update({id: $comp_id}).set($row).fetch().usingConnection(db);
					$comp_row = _.size($comp_row) && $comp_row[0] || {};

					if(await IndexDesignCompAptitude.count({
						id: $comp_id
					}).usingConnection(db)) {
						await IndexDesignCompAptitude.update({id: $comp_id}).set($index_set).usingConnection(db);
					} else {
						$index_set.id = $comp_id;
						await IndexDesignCompAptitude.create($index_set).usingConnection(db);
					}

					if(await CompAptitudeIndex.count({
						id: $comp_id
					}).usingConnection(db)) {
						await CompAptitudeIndex.update({id: $comp_id}).set($o_index_set).usingConnection(db);
					} else {
						$o_index_set.id = $comp_id;
						await CompAptitudeIndex.create($o_index_set).usingConnection(db);
					}

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			const mq = new MqApi(req);
			mq.notifyUpdateComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	verifyAptitudeSaleComp: async function(req, res) {
		var $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('企业不存在');

        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_BASEINFO)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
		if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_SELL) return res.jsonerr('非销售公司');

        var $set = {
			ability_service: { //服务能力
				zdcp: [], //主打产品
			},
			stat: { //公司现状
				n_employee: 0,
				reg_date: ''
			},
			store: [], //经营店铺
			brand: [] //品牌证书
		};


		var item = null;
		try {
			item = $comp_row.aptitude ? JSON.parse($comp_row.aptitude) : null;
			if(item && _.size(item)) $set = item;
		} catch(e) {}


		let $contact = req.param('contact');
		$set.contact = {
			name   : _.size($contact) && _.size($contact.name) && $contact.name || '',
			mobile : _.size($contact) && _.size($contact.mobile) && $contact.mobile || ''
		};


		//服务能力
		if(typeof req.param('ability_service') != 'undefined') {
			var $ability_service = req.param('ability_service');

			//主打产品
			if($ability_service.zdcp) {
				item = $ability_service.zdcp;
				$set.ability_service.zdcp = item || [];

				//if(_.isArray(item) && _.size(item)) {
				//	_.each(item, function(it) {
				//		$set.ability_service.zdcp.push(it);
				//	});
				//}
			}
		}

		//公司现状
		if(typeof req.param('stat') != 'undefined') {
			var $stat = req.param('stat');

			//总人数
			if($stat.n_employee) {
				$set.stat.n_employee = parseInt($stat.n_employee);
			}

			//成立时间
			if($stat.reg_date) {
				$set.stat.reg_date = $stat.reg_date;
			}
		}

		//经营店铺
		if(typeof req.param('store') != 'undefined') {
			item = req.param('store');
			$set.store = [];

			if(_.isArray(item) && _.size(item)) {
				_.each(item, function(it) {
					it.name = it.name && it.name.toString().trim() || '';
					it.channel = it.channel && it.channel.toString().trim() || '';
					it.url = it.url && it.url.toString().trim() || '';
					$set.store.push(it);
				});
			}
		}

		//品牌证书
		if(typeof req.param('brand') != 'undefined') {
			item = req.param('brand');
			$set.brand = [];

			if(_.isArray(item) && _.size(item)) {
				_.each(item, function(it) {
					it.name = it.name.toString().trim() || '';
					var it_photo = [];
					if(it.photo) {
						_.each(it.photo, function(p) {
							p = p.toString().trim();
							if(p.length) it_photo.push(p);
						});
					}
					it.photo = it_photo;
					$set.brand.push(it);
				});
			}
		}

		var $row = {
			aptitude: JSON.stringify($set),
			aptitudeScore: 0
		};

		if(_.size($set.ability_service.zdcp)) $row.aptitudeScore += 25;
		if($set.stat.nEmployee || $set.stat.reg_date) $row.aptitudeScore += 25;
		if(_.size($set.store)) $row.aptitudeScore += 25;
		if(_.size($set.brand)) $row.aptitudeScore += 25;

		$row.aptitudeStat = CONST.APTITUDE_STAT_SUCCESS;
		$row.aptitudeMsg = '';

		$comp_row = await Comp.update({id: $comp_id}).set($row).fetch();
		$comp_row = _.size($comp_row) && $comp_row[0] || {};

		try {
			const mq = new MqApi(req);
			mq.notifyUpdateComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}
		return res.jsonok('ok');
	},

	getCompAptitude: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
	
        var $comp_row = await Comp.findOne({
			where: {
				id: $comp_id
			},
			select: [
				"compType",
				"contactName",
				"contactMobile",
				"aptitude",
				"aptitudeScore",
				"aptitudeStat",
				"aptitudeMsg"
			]
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

		try {
			$comp_row.aptitude = JSON.parse($comp_row.aptitude);
		} catch(e) {
			$comp_row.aptitude = {};
		}

		if(
			(
				$comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY || 
				$comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER
			) &&
			(
				!_.size($comp_row.aptitude) || 
				!_.size($comp_row.aptitude.contact) || 
				!_.size($comp_row.aptitude.contact.mobile)
			)
		) {
			$comp_row.aptitude.contact = {
				name   : $comp_row.contactName,
				mobile : $comp_row.contactMobile
			}
		}

		var ret = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
			"aptitude",
			"aptitudeScore",
			"aptitudeStat",
			"aptitudeMsg"
		]));

        return res.jsonok(ret);
	},


	getDictFactoryServiceAbility: async function(req, res) {
		var field_rows = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, CONST.FACTORY_APTITUDE_DICT_FORM);

		var ret_fds = ["id", "name", "type", "options"];
		var $map = {};
		_.each(CONST.FACTORY_APTITUDE_DICT_FORM_MAP.fds, function(v,k) {
			$map[v] = k;
		});

		var $ret = {};
		_.each(field_rows, function(row) {
			var $vid = $map[row.id];
			if($vid) $ret[$vid] = row.options;
		});

		return res.jsonok($ret);
	},

	getDictFactoryMakeAbility: async function(req, res) {
		var form_rows = await DictForm.getForms(CONST.FACTORY_ABILITY_FORM_GROUP);
		var field_rows = await DictForm.getFields(CONST.FACTORY_ABILITY_FORM_GROUP);

		var ret_fds = ["id", "name", "formId", "formName", "type", "options"];
		var $ret = {};
		var $map = {};
		_.each(field_rows, function(row) {
			var ret_row = cutil.snakeCaseObject(cutil.getRowCols(row, ret_fds));
			ret_row.vid = $map[ret_row.id];
			if(typeof $ret[ret_row['form_id']] == 'undefined') {
				$ret[ret_row['form_id']] = {
					id: ret_row['form_id'],
					name: ret_row['form_name'],
					quota: []
				};
			}
			$ret[ret_row['form_id']]['quota'].push({
				id: ret_row['id'],
				name: ret_row['name'],
				type: ret_row['type'],
				options: ret_row['options']
			});
		});

		_.each(form_rows, function(row) {
			$ret[row.id] = $ret[row.id] || {
				id: row.id,
				name: row.name,
				quota: []
			};
		});

		return res.jsonok(_.values($ret));
	},


	getDictDesignCompServiceAbility: async function(req, res) {
		var field_rows = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, CONST.DESIGN_COMP_APTITUDE_DICT_FORM);

		var ret_fds = ["id", "name", "type", "options"];
		var $map = {};
		_.each(CONST.DESIGN_COMP_APTITUDE_DICT_FORM_MAP.fds, function(v,k) {
			$map[v] = k;
		});

		var $ret = {};
		_.each(field_rows, function(row) {
			var $vid = $map[row.id];
			if($vid) $ret[$vid] = row.options;
		});

		return res.jsonok($ret);
	},


	getDictCompZone: async function(req, res) {
		let $zone_rows = await DictCompZone.find();
		$zone_rows = _.size($zone_rows) ? $zone_rows : [];
	
		return res.jsonok($zone_rows);
	},
};
