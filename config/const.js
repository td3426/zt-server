
//全局常量定义 - 模拟
global.CONST = {};
var c = global.CONST;


//---------------- public -----------------

//法大大
c.FADADA_ACCOUNT_TYPE_PERSON = 1; //账号类型：个人
c.FADADA_ACCOUNT_TYPE_COMPANY = 2; //账号类型：企业

//公司类型
c.COMPONY_TYPE_FURNITURE_FACTORY      = 1; //家具工厂
c.COMPONY_TYPE_FURNITURE_DESIGNER     = 2; //家具设计公司
c.COMPONY_TYPE_FURNITURE_SELL         = 3; //家具销售公司
c.COMPONY_TYPE_FURNITURE_SHARE_SAMPLE = 4; //共享打样中心
c.COMPONY_TYPE_FURNITURE_SHARE_PAINT  = 5; //共享喷涂中心
c.COMPONY_TYPE_SUPPLY                 = 6; //供应商
c.COMPONY_TYPE_SHIPPING               = 7; //物流公司
c.COMPONY_TYPE_FINANCE                = 8; //金融服务公司
c.COMPONY_TYPE_RISKCONTROL            = 9; //风控公司
c.COMPONY_TYPE_GOV                    = 99; //政府

//注册来源，1自主注册，2平台代注册, 3平台已删除账号，20入规批量导入
c.COMPONY_REG_FROM_SELF    = 1;
c.COMPONY_REG_FROM_PLAT    = 2;
c.COMPONY_REG_FROM_DEL     = 3;
c.COMPONY_REG_FROM_IN_SPEC = 20;

//审核状态
c.CERTIFYCATION_STAT_UNAPLLY = 0; //未申请
c.CERTIFYCATION_STAT_APLLY = 1; //已申请
c.CERTIFYCATION_STAT_SUCCESS = 2; //已通过
c.CERTIFYCATION_STAT_FAILED = 3; //未通过

//资质状态，0未填写，1已提交，2审核通过，3审核不通过
c.APTITUDE_STAT_UNAPLLY = 0; //未填写
c.APTITUDE_STAT_APLLY = 1; //已提交
c.APTITUDE_STAT_SUCCESS = 2; //已通过
c.APTITUDE_STAT_FAILED = 3; //未通过

//---------------- /public -----------------


//---------------- user center -----------------

//注册步骤
c.USER_STEP_MOBILE = 0; //手机号注册，只注册了手机号，完成了第一步
c.USER_STEP_COMPTYPE = 1; //手机号注册，选择了公司类型，完成了第二步
c.USER_STEP_COMPINVITE = 10; //邀请注册，填写了邀请信息
c.USER_STEP_COMP = 2; //关联了公司

//用户状态
//0备用，1有效，2禁止登录，3已解绑
c.USER_STAT_OK      = 1;
c.USER_STAT_NOLOGIN = 2;
c.USER_STAT_DEL     = 3;
//---------------- /user center -----------------


//---------------- user center admin -----------------

c.FACTORY_APTITUDE_DICT_FORM = 'factory_aptitude_dict_form'; //工厂资质字典
c.DESIGN_COMP_APTITUDE_DICT_FORM = 'design_comp_aptitude_dict_form'; //设计公司资质字典

c.APTITUDE_DICT_FORM_GROUP = 'aptitude_dict_form_group'; //资质字典
c.FACTORY_ABILITY_FORM_GROUP = 'factory_ability_dict_form_group'; //工厂工艺能力字典

c.FACTORY_APTITUDE_DICT_FORM_MAP = {
	id: 'factory_aptitude_dict_form',
	vid: 'factory_aptitude_dict_form',
	fds: {
		jgsx: 'c1792a4f66a44f06b1d89f7fa98529fe',
		mczl: 'a5bc51949e3b4ca38ba028a1b9efceea',
		wx: '576a3da7760b472983213734e4cabf8d',
		xsbq: 'b8496d5d0c90423cb8e3e402bb988e82',
		fwbq: 'd918cd0aa3274db0badca73856421cc1'
	}
};

c.DESIGN_COMP_APTITUDE_DICT_FORM_MAP = {
	id: 'design_comp_aptitude_dict_form',
	vid: 'design_comp_aptitude_dict_form',
	fds: {
		range: '4fb27be18edb4e3894a0c3823bbe2f63',
	}
};

//field类型，1单选，2多选，3文本，4整数，5小数，6百分比
c.DICT_FORM_FIELD_OPTION_TYPE_RADIO = 1;
c.DICT_FORM_FIELD_OPTION_TYPE_CHECKBOX = 2;
c.DICT_FORM_FIELD_OPTION_TYPE_TEXT = 3;
c.DICT_FORM_FIELD_OPTION_TYPE_INT = 4;
c.DICT_FORM_FIELD_OPTION_TYPE_DOT = 5;
c.DICT_FORM_FIELD_OPTION_TYPE_PERCENT = 6;

c.FACTORY_EMPLOYEE_MAP = [
	{id: 1, name: '1-20人'},
	{id: 2, name: '21-50人'},
	{id: 3, name: '51-100人'},
	{id: 4, name: '101-200人'},
	{id: 5, name: '201-500人'},
	{id: 6, name: '501-1000人'},
	{id: 7, name: '1000人以上'},
];

c.N_REG_DATE_MAP = [
	{id: 1, name: '1年内',    tmdiff_min: 86400000 * 365 * 0, tmdiff_max: 86400000 * 365 * 1},
	{id: 2, name: '1-3年',    tmdiff_min: 86400000 * 365 * 1, tmdiff_max: 86400000 * 365 * 3},
	{id: 3, name: '3-5年',    tmdiff_min: 86400000 * 365 * 3, tmdiff_max: 86400000 * 365 * 5},
	{id: 4, name: '5-10年',   tmdiff_min: 86400000 * 365 * 5, tmdiff_max: 86400000 * 365 * 10},
	{id: 5, name: '10年以上', tmdiff_min: 86400000 * 365 * 10, tmdiff_max: 86400000 * 365 * 999},
];

//经销商状态，0保留，1已申请，2已通过，3已拒绝
c.AGENCY_STAT_APPLY  = 1;
c.AGENCY_STAT_OK     = 2;
c.AGENCY_STAT_FAILED = 3;

//---------------- /user center -----------------


//---------------- product center -----------------

//产品创建类型
c.PRODUCT_CREATEDBY_TYPE_DESIGNER = 0; //0设计师创建
c.PRODUCT_CREATEDBY_TYPE_FACTORY = 1; //1工厂创建

c.PRODUCT_PERCENT_MAX_COOPERATED_FACTORY = 10; //分成合作商品最大合作工厂数量

//产品价格类型
//价格类型，0设计版权销售，1分成合作销售，2工厂自有商品，3需求定制订单，4暂不确定类型
c.PRODUCT_PRICE_TYPE_PRICE = 0;
c.PRODUCT_PRICE_TYPE_PERCENT_PRICE = 1;
c.PRODUCT_PRICE_TYPE_FACTORY_SELF = 2;
c.PRODUCT_PRICE_TYPE_REQUIRE_ORDER = 3;
c.PRODUCT_PRICE_TYPE_UNKNOWN = 4;

//产品状态，0已创建，1可用/已上架，2已过期/已下架，3已终止/已删除，4回收站，5交易中
c.PRODUCT_STAT_CREATED = 0;
c.PRODUCT_STAT_PUBLISHED = 1;
c.PRODUCT_STAT_INUSE = 1;
c.PRODUCT_STAT_BANED = 2;
c.PRODUCT_STAT_EXPIRED = 2;
c.PRODUCT_STAT_DELETED = 3;
c.PRODUCT_STAT_END = 3;
c.PRODUCT_STAT_TRASH = 4;
c.PRODUCT_STAT_TRANS = 5;

//产品在集市的发布状态，0不发布，1发布
c.PRODUCT_MARMET_STAT_BAND        = 0;
c.PRODUCT_MARMET_STAT_PUBLISHED   = 1;
c.PRODUCT_MARMET_STAT_UNPUBLISHED = 2;

//产品在销售手册的发布状态，0不发布，1发布
c.PRODUCT_HANDBOOK_STAT_BAND = 0;
c.PRODUCT_HANDBOOK_STAT_PUBLISHED = 1;

c.PRODUCT_SKU_STAT_ENABLED = 1; //启用
c.PRODUCT_SKU_STAT_BAND    = 2; //禁用
c.PRODUCT_SKU_STAT_DEL     = 3; //已删除


//交易状态, 0已创建，1买方发起签合同，2买方已签合同，3卖方发起签合同，4卖方已签合同，5买方已付款，6卖方确认收款，7卖方已发货，8买方已收货，9买方已评价，10卖方已评价，11交易完成，21卖方已修改商品信息，22库存不足
//已签约列表 '>=': CONST.TRANSACTION_STAT_SIGNED_BUY and '<=': CONST.TRANSACTION_STAT_COMPLETE

c.TRANSACTION_STAT_CREATED                  = 0;
c.TRANSACTION_STAT_SIGN_BUY                 = 1;
c.TRANSACTION_STAT_SIGNED_BUY               = 2;
c.TRANSACTION_STAT_SIGN_SELL                = 3;
c.TRANSACTION_STAT_SIGNED_SELL              = 4;
c.TRANSACTION_STAT_PAID                     = 5;
c.TRANSACTION_STAT_PAID_OK                  = 6;
c.TRANSACTION_STAT_SHIPPED                  = 7;
c.TRANSACTION_STAT_ACTEPTED                 = 8;
c.TRANSACTION_STAT_REMARDED_BY_A            = 9;
c.TRANSACTION_STAT_REMARDED_BY_B            = 10;
c.TRANSACTION_STAT_COMPLETE                 = 11;
c.TRANSACTION_STAT_CLOSED_BY_PRODUCT_UPDATE = 21;
c.TRANSACTION_STAT_STOCK_EMPTY              = 22;

c.PRICE_PRODUCT_TRANSACTION_STAT_OTHER_SIGNED_OK          = 29; //商品被其他人签约了

//交易商品类型，0保留，1设计版权单品，2设计版权套系
c.TRANSACTION_PRODUCT_TYPE_PRODUCT = 1;
c.TRANSACTION_PRODUCT_TYPE_SET     = 2;

//合同状态，0已创建, 10已生成合同，1待A签约，2A签约完成，3待B签约，4B签约完成
c.CONTRACT_STAT_CREATED = 0;
c.CONTRACT_STAT_SIGNA = 1;
c.CONTRACT_STAT_SIGNEDA = 2;
c.CONTRACT_STAT_SIGNB = 3;
c.CONTRACT_STAT_SIGNEDB = 4;
c.CONTRACT_STAT_READY = 10;

//统计类型
c.STATISTICS_TYPE_PRODUCT_VISITED = 1; //按产品浏览
c.STATISTICS_TYPE_PRODUCT_SIGNEDB = 2; //按产品签约
c.STATISTICS_TYPE_PRODUCT_ADDED = 3; //按产品新增
c.STATISTICS_TYPE_PRODUCT_SIGNEDA = 4; //按产品待签约
c.STATISTICS_TYPE_PRODUCT_COMPLETE_PRICE = 5; //按产品完成金额

//统计周期
c.STATISTICS_PERIOD_ALL = 0; //全部
c.STATISTICS_PERIOD_TODAY = 1; //今日
c.STATISTICS_PERIOD_CURMONTH = 2; //本月


//权限类型
c.PRIV_COMP_MANAGE_BASEINFO      = 1001; //管理企业信息
c.PRIV_COMP_MANAGE_STRUCTURE     = 1002; //管理企业通讯录
c.PRIV_COMP_MANAGE_PRIVS         = 1003; //管理企业成员角色权限
c.PRIV_COMP_MANAGE_REMOVE_MEMBER = 1009; //员工解绑

c.PRIV_COMP_SIGN_MANAGE    = 1004; //印章管理
c.PRIV_CONTRACT_SIGN       = 1005; //经办合同
c.PRIV_CONTRACT_TPL_MANAGE = 1006; //模板管理


c.PRIV_DESIGN_MANAGE_MY_PRODUCT       = 1051; //设计公司-设计管理
c.PRIV_DESIGN_MANAGE_MY_DASHBOARD     = 1053; //设计公司-我的

c.PRIV_FACTORY_MANAGE_SELL_POOL       = 1101; //销售池
c.PRIV_FACTORY_MANAGE_DESIGN_CONTRACT = 1102; //工厂企业-管理设计作品
c.PRIV_GOV_FILING                     = 1103; //政府政策
c.PRIV_FACTORY_MANAGE_MY_DASHBOARD    = 1104; //工厂企业-我的


c.PRIV_CONFIRM_MONEY = 1008; //确认收款

c.ASYNC_TASK_TYPE_ADD_PRODUCT_TO_MES = 1; //版权商品和分成合作商品发布到mes

//状态，0创建，1处理中，2处理成功，3处理失败
c.ASYNC_TASK_STAT_CREATED = 0;
c.ASYNC_TASK_STAT_DOING = 1;
c.ASYNC_TASK_STAT_SUCESS = 2;
c.ASYNC_TASK_STAT_FAILED = 3;

//---------------- /product center -----------------


//---------------- admin -----------------

c.ADMIN_ID = 899; //admin user id
c.ADMIN_PRIV_PRIV = 130;
c.ADMIN_PRIV_ROLE = 131;
c.ADMIN_PRIV_ADMUSER = 132;
c.ADMIN_PRIV_NAV = 133;
c.ADMIN_PRIV_DICT = 199;

//---------------- /admin -----------------


//---------------- crm -----------------

//CRM权限
c.CRM_PRIV_ASSIGN_BD = 501;

//资源池类型
c.CRM_RES_POOL_FACTORY = 1; //工厂

//跟进日志类型，0引导注册，1产品上传，2问题答疑，3资质审核，4实地寻访
c.CRM_FOLLOW_LOG_GUID = 0;
c.CRM_FOLLOW_LOG_POST_PRODUCT = 1;
c.CRM_FOLLOW_LOG_ANSWER = 2;
c.CRM_FOLLOW_LOG_APTITUDE = 3;
c.CRM_FOLLOW_LOG_VISITED = 4;

//OPLOG TYPE，0预留，1账号注册，2账号登录，3账号修改密码，4加入企业，5退出企业，6发送初始密码
c.OP_LOG_TYPE_ACCOUNT_REG           = 1;
c.OP_LOG_TYPE_ACCOUNT_LOGIN         = 2;
c.OP_LOG_TYPE_ACCOUNT_MODIFY_PASSWD = 3;
c.OP_LOG_TYPE_ACCOUNT_JOIN_COMP     = 4;
c.OP_LOG_TYPE_ACCOUNT_QUIT_COMP     = 5;
c.OP_LOG_TYPE_ACCOUNT_SEND_PASS     = 6;

//会员类型，0保留，1智联网注册,2平台管理员
c.USER_TYPE_UC         = 1;
c.USER_TYPE_PLAT_ADMIN = 2;

//---------------- /crm -----------------

