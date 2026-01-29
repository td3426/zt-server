'use strict';

const moment  = require('moment');
const flaverr = require('flaverr');
const amqp    = require('amqplib');


const MqApi = function(req) {
	this.req       = req;
	this.name      = 'MQ';
	this.host      = sails.config.mqApi.host;
	this.port      = sails.config.mqApi.port;
	this.user      = sails.config.mqApi.user;
	this.pass      = sails.config.mqApi.pass;

	return this;
};

MqApi.prototype.connect = async function() {
	if(!global['mqApiConn']) global['mqApiConn'] = await amqp.connect('amqp://' + this.user + ':' + this.pass + '@' + this.host + ':' + this.port);
	global['mqApiConn'].on('close', function() {
		sails.log.error('mq closed');
		global['mqApiConn'] = null;
	});
	global['mqApiConn'].on('error', function() {
		sails.log.error('mq error');
		global['mqApiConn'] = null;
	});
};

MqApi.prototype.send = async function($exchange, $route, $data) {
	await this.connect();
	const $conn = global['mqApiConn'];
	try {
		const $channel = await $conn.createChannel();
		await $channel.assertExchange($exchange, 'topic', { 
			durable   : true, //持久化
		});
		await $channel.publish($exchange, $route, Buffer.from(JSON.stringify($data)));
	} catch($e) {
		sails.log.error($e);
		throw flaverr('E_USER_ERROR', new Error(this.name + ': ' + ($e.message || '未知错误')));
	}
};

MqApi.prototype.startTrans = async function($exchange) {
	await this.connect();
	this.transConn = global['mqApiConn'];
	this.transExchange = $exchange;
	try {
		this.transChannel = await this.transConn.createChannel();
		await this.transChannel.assertExchange($exchange, 'topic', { 
			durable   : true, //持久化
		});
	} catch($e) {
		sails.log.error($e);
		throw flaverr('E_USER_ERROR', new Error(this.name + ': ' + ($e.message || '未知错误')));
	}
};

MqApi.prototype.tranSend = async function($route, $data) {
	sails.log.debug('trans send mq: \n' + JSON.stringify($data, null, '\t'));
	try {
		let pb = await this.transChannel.publish(this.transExchange, $route, Buffer.from(JSON.stringify($data)));
		sails.log('publish return:', pb);
	} catch($e) {
		sails.log($e);
	}
};

MqApi.prototype.endTrans = async function() {
};


MqApi.prototype.notifyAddSpu = async function($data) {
	sails.log.debug('add spu(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.product.exchange, sails.config.mqApi.product.routeSpuAdd, $data);
};

MqApi.prototype.notifyUpdateSpu = async function($data) {
	sails.log.debug('update spu(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.product.exchange, sails.config.mqApi.product.routeSpuUpdate, $data);
};

MqApi.prototype.notifyAddSku = async function($data) {
	sails.log.debug('add sku(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.product.exchange, sails.config.mqApi.product.routeSkuAdd, $data);
};

MqApi.prototype.notifyUpdateSku = async function($data) {
	sails.log.debug('update sku(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.product.exchange, sails.config.mqApi.product.routeSkuUpdate, $data);
};


MqApi.prototype.notifyAddComp = async function($data) {
	sails.log.debug('add comp(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.company.exchange, sails.config.mqApi.company.routeAdd, $data);
};

MqApi.prototype.notifyUpdateComp = async function($data) {
	sails.log.debug('update comp(' + $data.id + ') to mq');
	this.send(sails.config.mqApi.company.exchange, sails.config.mqApi.company.routeUpdate, $data);
};


module.exports = MqApi;

