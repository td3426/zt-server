
const moment = require('moment');

module.exports = {


    friendlyName: 'create db data',


    description: 'create database init data',


    inputs: {

    },


    fn: async function (inputs, exits) {

        moment.locale('zh-cn');
        sails.log('创建数据库初始数据');

		await AdminPriv.create({
			id: 130,
			name: '管理权限代码',
			privType: 0,
			catId: 0
		});

		await AdminUser.createUser({
			id: 899,
			mobile: '16667778881',
			passwd: await sails.helpers.passwords.hashPassword('111111'),
			name: 'admin',
		});


        // var path = require('path');
        // var fs = require('fs');
        //var $c = fs.readFileSync(path.resolve(sails.config.appPath, 'odata/data_robots.json'));
        //fs.copyFileSync(path.resolve(sails.config.appPath, 'odata/' + item.thumb), path.resolve(sails.config.appPath, 'assets/uimg/imp/' + $pd_id + path.extname(item.thumb)));

        // sails.log.debug(sails.getUrlFor('attrDict.edit').replace(':id', 3));
        // _.each(sails.config.routes, function(v, k){
        //     var $k = k.replace(/\s+/, ' ').toLowerCase();
        //     sails.log.debug($k);
        // });

        // sails.log(await sails.helpers.cache.set('abc:test', 'test value'));
        // sails.log(await sails.helpers.cache.get('abc:test'));
        // sails.log(await sails.helpers.cache.expire('abc:test', 2800));
        // sails.log(await sails.helpers.cache.ttl('abc:test'));

        return exits.success();

    }

};
