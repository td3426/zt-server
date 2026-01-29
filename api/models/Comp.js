
module.exports = {
    tableName: 'company',
    attributes: {
        fddOpenId: {
            type: 'string',
            description: '法大大关联openid',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: '23413'
        },

        sourceId: {
            type: 'string',
            maxLength: 255,
			allowNull: true,
            defaultsTo: '',
        },

        compCode: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
            example: '23413'
        },

        compType: {
            type: 'number',
            description: '公司类型，1工厂，2设计公司，99政府',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        regFrom: {
            type: 'number',
            defaultsTo: 1,
            columnType: 'int(11)'
        },

        name: {
            type: 'string',
            description: '全称',
            maxLength: 255,
            defaultsTo: '',
            example: '上海xxx有限公司'
        },

        shortName: {
            type: 'string',
            description: '简称',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: 'xxx'
        },

        desc: {
            type: 'string',
            description: '企业简介',
			allowNull: true,
            example: 'xxx'
        },

        photos: {
            type: 'string',
            description: '企业图片，多张图用英文逗号隔开',
			allowNull: true,
            example: 'xxx'
        },
		
		factoryArea: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
		nEmployee: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
		category: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true
        },

        province: {
            type: 'string',
            description: 'The province name.',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: '四川省'
        },

        city: {
            type: 'string',
            description: 'The city name.',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: '成都市'
        },

        county: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        town: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        addr: {
            type: 'string',
            description: '详细地址',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        logo: {
            type: 'string',
            description: 'logo',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        contactName: {
            type: 'string',
            description: '联系人姓名',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        contactPosition: {
            type: 'string',
            description: '联系人职务',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        contactMobile: {
            type: 'string',
            description: '联系人电话',
            maxLength: 255,
			allowNull: true,
            defaultsTo: '',
            example: ''
        },
		
		ability: {
            type: 'number',
            description: '',
            defaultsTo: 5,
            columnType: 'int(11)',
            example: '0'
        },
		
		credit: {
            type: 'number',
            description: '',
            defaultsTo: 5,
            columnType: 'int(11)',
            example: '0'
        },
		
		nMarketProduct: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
        creditIdCode: {
            type: 'string',
            description: '统一社会信用代码',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        creditImage: {
            type: 'string',
            description: '统一社会信用代码证件照路径',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        bankIdCode: {
            type: 'string',
            description: '银行帐号',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        bankName: {
            type: 'string',
            description: '银行名称',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        bankSubbranch: {
            type: 'string',
            description: '开户支行名称',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        legalName: {
            type: 'string',
            description: '法人姓名',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        legalIdCode: {
            type: 'string',
            description: '法人身份证号码',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        legalMobile: {
            type: 'string',
            description: '法人手机号(仅支持国内运营商)',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        legalIdFront: {
            type: 'string',
            description: '法人身份证照片',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        agentName: {
            type: 'string',
            description: '代理人姓名',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        agentIdCode: {
            type: 'string',
            description: '代理人身份证号码',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        agentMobile: {
            type: 'string',
            description: '代理人手机号(仅支持国内运营商)',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        agentIdFront: {
            type: 'string',
            description: '代理人身份证照片',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        principalType: {
            type: 'number',
            description: '企业负责人身份 company_principal_type，1法人，2代理人',
            defaultsTo: 1,
            columnType: 'int(11)',
            example: '0'
        },

        certStat: {
            type: 'number',
            description: '认证信息审核状态',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        certId: {
            type: 'number',
            description: '认证信息审核记录id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        certMsg: {
            type: 'string',
            description: '认证信息审核不通过原因',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        fddVerifyUrl: {
            type: 'string',
            description: '法大大认证URL',
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        fddVerifyTransactionNo: {
            type: 'string',
            description: '法大大认证交易号',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        aptitude: {
            type: 'string',
            description: '',
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        aptitudeScore: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        aptitudeStat: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
		onTimeRate: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
		pubNewRate: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },
		
		saleSumAmount: {
            type: 'number',
            description: '',
            defaultsTo: 0.000,
            columnType: 'int(11)',
            example: '0'
        },

        aptitudeMsg: {
            type: 'string',
            description: '',
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        createdBy: {
            type: 'number',
            description: '创建人id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        nOnsaleMarketProduct: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        nOnsaleSalebookProduct: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        nProductCopyRight: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        nProductPercent: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        nOnsale: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        isInSpec: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        isInBrandGroup: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },
		
		zoneId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },
		
		IsConceal: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },
		
		//createdAt: false,
        //updatedAt: false,


    },

	genCompCode: async function(conn) {
        let $comp_count = await Comp.count();
        let $rand_min = 1000;
        let $rand_max = 99999999;

        if($comp_count < 100000) $rand_max = 999999;
        else if($comp_count < 10000000) $rand_max = 99999999;
        else $rand_max = 9999999999;


        let $compCodeGet = false;
        let $compCode = _.random($rand_min, $rand_max);

        for (let i = 0;i < 10; i ++) {
			if(conn) {
				if(!await Comp.count({
					compCode: $compCode
				}).usingConnection(conn)) {
					$compCodeGet = true;
					break;
				}
			} else {
				if(!await Comp.count({
					compCode: $compCode
				})) {
					$compCodeGet = true;
					break;
				}
			}

            $compCode = _.random($rand_min, $rand_max);
        }

        if(!$compCodeGet) throw "生成公司码失败";

		return $compCode;
	},

    getComps: async function($ids, $fds) {
        let $queryOpts = {
            where: {
                id: {
                    in: $ids
                }
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $rows = await Comp.find($queryOpts);
        let $ret = {};
        _.each($rows, function($row){
            if($fds && _.isArray($fds)) {
                let $tmp = {};
                let $i = 0, $len = $fds.length, $k;
                for(; $i < $len; $i ++) {
                    $k = $fds[$i];
                    if(typeof $row[$k] != 'undefined') {
                        $tmp[$k] = $row[$k];
                    }
                }

                $ret[$row.id] = $tmp;
            } else {
                $ret[$row.id] = $row;
            }
        });

        return $ret;
    },
};

