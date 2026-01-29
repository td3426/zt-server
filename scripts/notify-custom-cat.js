
const flaverr = require('flaverr');
const moment = require('moment');
const amqp   = require('amqplib');


async function customCatNotify($params) {
	if(!_.size($params)) return;

	//删除
	if($params.opt == 'del' && _.size($params.id)) {
		let $custom_cat_no = $params.id.trim();

		await FactoryProduct.update({
			customCatNo: $custom_cat_no
		}).set({
			customCatNo: ''
		});
	}
}

module.exports = {
	friendlyName: 'notify-custom-cat',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		sails.log('start custom cat notify process');

		let $conf = sails.config.mqApi;
		let $conn;
		let $quit = false;

		//process.once('SIGINT', function() { });

		try {
			$conn = await amqp.connect('amqp://' + $conf.user + ':' + $conf.pass + '@' + $conf.host + ':' + $conf.port);
			$conn.on('error', function($e) {
				sails.log.error('channel error: ', $e);
			});
			$conn.on('close', function() {
				$quit = true;
			});

			let $channel = await $conn.createChannel();
			let $queue = await $channel.assertQueue($conf.customCat.queueName, { 
				durable   : true, //持久化
			});

			await $channel.bindQueue($queue.queue, $conf.customCat.exchange, $conf.customCat.route);
			await $channel.consume($queue.queue, msg => {
				if (msg !== null) {
					try {
						let $msg = msg.content.toString();
						sails.log('notify by mq(' + msg.fields.routingKey + ')[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']: ' + $msg);
						let $params = JSON.parse($msg);
						switch(msg.fields.routingKey) {
							case $conf.customCat.route:
								customCatNotify($params).catch(function($e) {
									sails.log.error($e);
								});
								break;
						}
						
					} catch($e) {
						sails.log.error('msg error: ', $e);
					}

					$channel.ack(msg);
				}
			}, {
				noAck: false //需要发送处理回执，表示必须等到处理完成才能删除队列
			});
		} catch($e) {
			$conn && $conn.close();
			sails.log.error($e);

			if(
				$e.code == 'ECONNREFUSED' || //mq server down 
				$e.code == 404 || //exchange not found
				$e.code == 541 //mq server interal error
			) {
				await cutil.msleep(1000 * 60);
			}

			return exits.error($e.message);
		}

		while(true) {
			if($quit) break;

			await cutil.msleep(1000 * 2);
		}
		return exits.success('ok');
	}
};
