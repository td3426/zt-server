const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	checkMobileCode: async function(req, res) {
		let $mobile = cutil.getReq(req, 'mobile');
		let $code = cutil.getReq(req, 'code');

        if(sails.config.devMode) {
            if($code != '999999') return res.jsonerr('验证码错误');
        } else {
            $code_row = await MobileCode.findOne({
                mobile: $mobile
            });
            if(!$code_row) return res.jsonerr('请先获取验证码');
    
            if(moment().valueOf() - $code_row.updatedAt >= 30 * 60 * 1000) {
                return res.jsonerr('验证码已经过期,请重新获取');
            }
    
            if($code_row.code != $code) return res.jsonerr('验证码错误');
        }

		return res.jsonok('ok');
	},

	sendGovApproveNotify: async function(req, res) {
		let $gov_user_ids = [], $factory_user_ids = [], $factory_id = 0;
		if(_.size(req.param('gov'))) {
			//您好，【工厂名称】的南康工业（家具）设计奖补均已审批通过，请登录系统nk001.com，设计企业入驻奖补处盖章
			let $group = req.param('gov');
			$factory_id = $group.factory_id || 0;
			if(_.isArray($group.user_id) && _.size($group.user_id)) {
				$gov_user_ids = $group.user_id.filter(v => (parseInt(v)));
			}
		}
		if(_.size(req.param('factory'))) {
			//您好，您的南康工业（家具）设计奖补均已审批通过，请登录系统nk001.com，设计企业入驻奖补处盖章
			let $group = req.param('factory');
			if(_.isArray($group.user_id) && _.size($group.user_id)) {
				$factory_user_ids = $group.user_id.filter(v => (parseInt(v)));
			}
		}

		if(!_.size($gov_user_ids)) return res.jsonerr('政府用户ID为空');
		if(!_.size($factory_user_ids)) return res.jsonerr('企业用户ID为空');
		if(!$factory_id) return res.jsonerr('企业ID为空');

		let $user_rows = await User.find({
			where: {
				id: $gov_user_ids.concat($factory_user_ids) 
			},
			select: ['id', 'mobile']
		});
		$user_rows = _.size($user_rows) && cutil.indexTabByCol($user_rows, 'id') || {};

		let $mobile_gov_users = [], $mobile_factory_users = [];
		let $error_id = 0;
		$factory_user_ids.map(v => {
			if(!_.size($user_rows[v])) {
				$error_id = v;
				return false;
			}
			$mobile_factory_users.push($user_rows[v].mobile);
		});
		if($error_id) return res.jsonerr('用户' + $error_id + '不存在');

		$gov_user_ids.map(v => {
			if(!_.size($user_rows[v])) {
				$error_id = v;
				return false;
			}
			$mobile_gov_users.push($user_rows[v].mobile);
		});
		if($error_id) return res.jsonerr('用户' + $error_id + '不存在');

		let $factory_row = await Comp.findOne($factory_id);
		if(!_.size($factory_row)) return res.jsonerr('企业不存在');

		try {
			await cutil.sendSMS($mobile_gov_users, sails.config.sendcloud.smsApproveNotifyGov, {comp: $factory_row.name});
			await cutil.sendSMS($mobile_factory_users, sails.config.sendcloud.smsApproveNotifyComp, {});
		} catch (err) {
			sails.log.error(err);
			return res.jsonerr(err.message || '短信发送失败');
		}

		return res.jsonok('ok');
	},
};
