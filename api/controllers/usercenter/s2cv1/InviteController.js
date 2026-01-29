const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    createInviteCode: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        let $user_id = req.me.id;
        var $invite_row = null;
        try {
            await InviteCode
                .destroy({
                    createdAt: {
                        '<': moment().valueOf() - 86400 * 1000 * 7
                    }
                });
            $invite_row = await InviteCode
                .find({
                    where: {
                        fromCompId: $comp_id,
                        fromUserId: $user_id
                    },
                    skip: 0,
                    limit: 1
                });
            $invite_row = $invite_row.length > 0 ? $invite_row[0] : null;
            if(!$invite_row || moment().valueOf() - $invite_row.createdAt > 86400 * 1000) {
                $invite_row = await InviteCode
                    .create({
                        fromCompId: $comp_id,
                        fromUserId: $user_id,
                        code: _.random(1000, 999999)
                    })
                    .fetch();
            }
        } catch (e) {
            sails.log.debug(e);
        }

        if(!$invite_row) return res.jsonerr('生成邀请码失败, 请重试');

        return res.jsonok({
            comp_code: $comp_row.compCode,
            invite_code: $invite_row.code,
            expired_at: Math.ceil((86400 * 1000 * 7 + $invite_row.createdAt) / 1000)
        });
    },

    send: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $mobiles = cutil.getReqSP(req, 'mobiles', 'string');
        $invite_code = cutil.getReq(req, 'invite_code');

        $mobiles = _.isArray($mobiles) ? $mobiles : [];
        if($mobiles.length < 1) return res.jsonerr('请输入手机号');

        var $mobile_need = {};
        for(let i = 0; i < $mobiles.length; i ++) {
            try{
                $vo = cutil.isMobile($mobiles[i]);
            } catch (e) {
                continue;
            }

            $mobile_need[$vo] = $vo;
        }

        if(_.size($mobile_need) < 1) return res.jsonerr('请输入手机号');


        $user_rows = await User.getUsersByMobile(_.values($mobile_need), ['id', 'mobile']);
        if(_.size($user_rows)) {
            let $ret_mobiles = _.values(cutil.getTabCol($user_rows, 'mobile'));
            return res.jsonerr($ret_mobiles.join(',') + '已经注册', 105, $ret_mobiles);
        }

        var $invite_row = await InviteCode.findOne({
            fromCompId: $comp_row.id,
            code: $invite_code
        });
        if(!$invite_row) return res.jsonerr('邀请码信息不存在, 请重试');
        if($invite_row.fromCompId != $comp_row.id) return res.jsonerr('邀请码信息错误, 请重试');

        try {
            if(sails.config.devMode) {
                return res.jsonok('ok');
            }

            await cutil.sendSMS($mobile_need, sails.config.sendcloud.smsInviteId, {id: $comp_row.compCode, code: $invite_row.code});
        } catch (err) {
            return res.jsonerr('邀请短信发送失败');
        }

        return res.jsonok('ok');
    }
};
