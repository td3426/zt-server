'use strict';

const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');

const MesApi = function() {
    this.host = sails.config.mesApi.host;

	return this;
};

async function get(uri, params) {
    if(sails.config.mesApi.debug) sails.log.debug("[MesApi] info: \nurl(get): " + this.host + uri + "\n", params);

    try {
        let result = await urllib.request(this.host + uri, {
            method: 'GET',
            timeout: [5000, 30000],
			headers: {
				"Content-Type": "application/json",
			},
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[MesApi Request] error: ", result);
            throw result.statusMessage;
        }

        if(sails.config.mesApi.debug) sails.log.debug("[MesApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));
        if(!ret || !ret.success) {
            sails.log.error("[MesApi] error: ", ret);
            throw ret.msg || "未知错误";
        }

        return typeof ret.content != 'undefined' ? ret.content : {};
    } catch(err) {
        sails.log.error("[MesApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw new Error('请求mes 10s超时');
        } else {
            throw err;
        }
    }
}

async function post(uri, params) {
    if(sails.config.mesApi.debug) sails.log.debug("[MesApi] info: \nurl(post): " + this.host + uri + "\n", params);
    try {
        let result = await urllib.request(this.host + uri, {
            method: 'POST',
            timeout: [5000, 30000],
			headers: {
				"Content-Type": "application/json",
			},
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[MesApi Request] error: ", result);
			throw flaverr('E_USER_ERROR', new Error(result.res && result.res.statusMessage || result.status));
        }

        if(sails.config.mesApi.debug) sails.log.debug("[MesApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));
        if(!ret || !ret.success) {
            sails.log.error("[MesApi] error: ", ret);
			throw flaverr('E_USER_ERROR', new Error(ret.msg || ret.message || '未知错误'));
        }

        return typeof ret.content != 'undefined' ? ret.content : {};
    } catch(err) {
        sails.log.error("[MesApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw flaverr('E_USER_ERROR', new Error('MesApi: 请求超时'));
		} else if(err && err.name == 'RequestError') {
			throw flaverr('E_USER_ERROR', new Error('MesApi: 请求失败'));
		} else {
            throw flaverr('E_USER_ERROR', new Error('MesApi: ' + (err.message || '未知错误')));
        }
    }
}


MesApi.prototype.getFactorySelfProducts = async function(compId, page, pagesize) {
    let params = {
		"search": {
			    "OrgId": compId
			  },
		  "pageIndex": page,
		  "pageSize": pagesize,
		  "noCount": false,
		  "orderBy": "",
		  "countSql": ""
    };

    return await post.call(this, 'productmanagement/ProInfo/ZtPaging2', params);
    //return await post.call(this, 'productmanagement/ProInfo/ZtPaging', params);
};

MesApi.prototype.getFactorySelfProduct = async function(compId, productId) {
	let params = {
		"id": productId,
		"oid": compId
    };

    return await get.call(this, 'productmanagement/ProInfo/ZtGetOne', params);
};

MesApi.prototype.getFactorySelfProductsByIds = async function(compId, product_ids) {
    let params = {
		  "orgId": compId,
		  "proIds": product_ids
	};

    return await post.call(this, 'productmanagement/ProInfo/ZtQuery', params);
};


MesApi.prototype.addFactoryBuyProduct = async function($product_row) {
	let params = {
		"productNo": "", //"123",商品号
		"productSN": "", //"12345",商品编码
		"category": "", //"床",类目名称
		"style": "", //"中国风",风格名称
		"name": "", //"席梦思",商品名称
		"heatIndex": "", //"20",商品的热度指数（0到100之间的整数，如：20）
		"proSpec": "", //"1.8m",商品规格
		"size": "", //"1200,1500,1800",商品的尺寸（长宽高，三个数据用逗号分隔，单位为mm）
		"uuId": "", //"uuid000010,uuid000011,uuid000012",商品与公司关联表的Id（如有过个Id，用逗号分隔）
		"remark": "",//备注
		"proUnit": "", //"件",商品单位（如：件）
		"picture": "", //"http://123,http://098,http://ppp",商品图片，多张图逗号分隔
		"series": "", //"大黄鸭",商品套系名称
		"createdId": "", //12,创建人Id
		"createdBy": "", //"李四",创建人名称
		"orgId": "", //"10,11,12",商品所有者的公司Id（如有多个公司Id，用逗号分隔），注意Id顺序要与之前的UuId一致。
		"proFashionZtModels": [//款式
			/*{
				"fashionNo": "001",//款式号
				"fashionSN": "fa011",//款式编号
				"productNo": "123",//商品号
				"colour": "紫色",//颜色名称（如：红色）
				"material": "橡胶木",//材质名称（如：胡桃木）
				"photos": "http://ph001,http://ph002,http://ph003",//图片，多张图片用逗号分隔
				"designPhotos": "http://des001,http://des002,http://des003",//渲染图，多张图片用逗号分隔
				"createdId": 12,//创建人Id
				"createdBy": "李四"//创建人名称
			}*/
		]
	};

    return await post.call(this, 'productmanagement/ProInfo/ZtAdd2', $product_row);
};

MesApi.prototype.addProduct = async function($spu_info) {
    return await post.call(this, 'productmanagement/ProInfo/ZtAdd4', $spu_info);
};

MesApi.prototype.updateProduct = async function($spu_info) {
    return await post.call(this, 'productmanagement/ProInfo/EditZtPro', $spu_info);
};

MesApi.prototype.delProduct = async function($params) {
	/*{
		spuid: '',
		skuid: ''
	}*/
    return await post.call(this, 'productmanagement/ProInfo/DeleteZtPro', $params);
};

MesApi.prototype.getProductNBom = async function($spuid_arr) {
    return await post.call(this, 'productmanagement/ProInfo/ZtProIsBom', $spuid_arr);
};

module.exports = MesApi;

