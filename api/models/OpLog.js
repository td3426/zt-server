
const moment = require('moment');

module.exports = {
    tableName: 'op_log',
    attributes: {},

    add: async function($app_id, $user_id, $op_type, $from, $to) {
		const $year = moment().year();
		const $tm = moment().valueOf();

		$app_id = parseInt($app_id) || 0;
		$user_id = parseInt($user_id) || 0;
		$op_type = parseInt($op_type) || 0;
		$op = JSON.stringify({
			from : $from,
			to   : $to
		});
		await sails.getDatastore().sendNativeQuery(
			"insert into op_log_$1 (appid, userId, opType, op, createdAt) values($2, $3, $4, $5, $6)",
			[
				$year,
				$app_id,
				$user_id,
				$op_type,
				$op,
				$tm
			]
		);
		return;
    },
};

