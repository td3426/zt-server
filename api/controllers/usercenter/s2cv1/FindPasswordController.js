const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

    reset: async function (req, res) {
        let $mobile        = cutil.getReq(req, 'mobile');
        let $code          = cutil.getReq(req, 'code');
        let $captcha       = cutil.getReq(req, 'captcha');
        let $captcha_token = cutil.getReq(req, 'captcha_token');
        let $new_passwd    = cutil.getReq(req, 'new_passwd');

        if(!cutil.authCaptcha($captcha, $captcha_token)) {
            return res.jsonerr('图形验证码不正确');
        }

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写手机号');
        }

        if($new_passwd.length < 8) return res.jsonerr('新密码长度至少8位');

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

        let $user_row = await User.getUserByMobile($mobile);
        if(!_.size($user_row)) return res.jsonerr('账号不存在');

        $password_hash = await sails.helpers.passwords.hashPassword($new_passwd);
        try{
            await User.setUser($user_row.id, {
                    passwd: $password_hash
                });
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }

        let $comp_row = await Comp.findOne({
			id: $user_row.compId
        });

        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})
		let $ret = {};

        $ret.token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginExp);

		$ret.token_expired = sails.config.loginToken.loginExp;

        $ret.refresh_token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginRefreshExp);

		$ret.user = {
			id           : $user_row.id,
			member_type  : $user_row.memberType,
			member_id    : $user_row.memberId,
			cert_stat    : $user_row.certStat,
			mobile       : $user_row.mobile,
			name         : $user_row.name,
			gender       : $user_row.gender,
			avatar       : $user_row.avatar,
			intro        : $user_row.intro,
			phone        : $user_row.phone,
			tel          : $user_row.tel,
			mail         : $user_row.mail,
			wechat       : $user_row.wechat,
			qq           : $user_row.qq,
			comp_id      : $user_row.compId || $user_row.fromCompId,
			comp_creator : $user_row.compCreator,
			privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
		};
		$ret.comp = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
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
			"legalName",
			"legalIdCode",
			"legalIdFront",
			"legalMobile",
			"certStat",
			"certMsg"
		]));

        return res.jsonok($ret);
    }
    
};
