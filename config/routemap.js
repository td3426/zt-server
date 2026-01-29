
const uc_path_pre = 'usercenter/s2cv1/';
const uc_adm_path_pre = 'usercenter-admin/s2cv1/';

const ucs_path_pre = 'usercenter/s2sv1/';

const pc_path_pre = 'productcenter/s2cv1/';
const pc_adm_path_pre = 'productcenter-admin/s2cv1/';

const pt_path_pre = 'portal/s2cv1/';

module.exports = {
	////////////////////// user center ///////////////////////
    //usercenter server to client api
    'group /uc/v1/ uc-s2c'                                     : {
        //'post ue_handle'                                     : uc_path_pre + 'ue.handle',
        'post create_captcha true'                             : uc_path_pre + 'captcha.create',
        'all merge-dict true'                                  : uc_path_pre + 'dictMerge.getDict',
        'post send-mobile-code true'                           : uc_path_pre + 'mobileCode.getCode',

        //'post login/get-mobile-step true'                    : uc_path_pre + 'login.getUserStep',
        'post login/is-mobile-reg true'                        : uc_path_pre + 'login.isMobileReg',

        'post login/get-mobile-code true'                      : uc_path_pre + 'mobileCode.loginCode',
        'post login/refresh-token'                             : uc_path_pre + 'login.refreshToken',
        'post login-by-account/auth true'                      : uc_path_pre + 'login.authAccount',
        'post login-by-mobile/auth true'                       : uc_path_pre + 'login.authMobile',
        'post login-by-token/auth true'                        : uc_path_pre + 'login.authToken',
        'post login-by-wx/auth true'                           : uc_path_pre + 'login.authWx',

        'post register/get-mobile-code true'                   : uc_path_pre + 'mobileCode.registerCode',
        'post register-by-mobile/reg true'                     : uc_path_pre + 'registerByAccount.regByMobile',
        //'post register-by-mobile/auth true'                  : uc_path_pre + 'registerByAccount.authMobile',
        //'post register-by-mobile/sel-comptype'               : uc_path_pre + 'registerByAccount.selCompType',
        //'post register-by-mobile/add-comp'                   : uc_path_pre + 'registerByAccount.addComp',

        'post register-by-invite/auth-invite-code true'        : uc_path_pre + 'registerByInvite.authInviteCode',
        'post register-by-invite/reg true'                     : uc_path_pre + 'registerByInvite.regByInvite',
        //'post register-by-invite/auth true'                  : uc_path_pre + 'registerByInvite.authCode',
        //'post register-by-invite/set-baseinfo'               : uc_path_pre + 'registerByInvite.setBaseinfo',

        'post find-password/get-mobile-code true'              : uc_path_pre + 'mobileCode.resetPasswdCode',
        'post find-password/reset true'                        : uc_path_pre + 'findPassword.reset',

        'post company/get-verified-comp-by-name true'          : uc_path_pre + 'company.getCompanyVerifiedStatByName',
        'post company/get-compname-by-code true'               : uc_path_pre + 'company.getCompanyNameByCode',
        'post company/get-all-companies'                       : uc_path_pre + 'company.getAllCompanies',

        'post company/get-dict-factory-zone true'              : uc_path_pre + 'company.getDictCompZone',
        'post company/get-comp-contact'                        : uc_path_pre + 'company.getCompanyContact',
        'post company/get-n-visited-comp-contact'              : uc_path_pre + 'company.getNVisitedCompanyContact',

        'post my-company/get-comp-baseinfo true'               : uc_path_pre + 'company.getCompanyBaseInfo',
        'post my-company/get-compinfo'                         : uc_path_pre + 'company.getCompanyInfo',
        'post my-company/set-compinfo'                         : uc_path_pre + 'company.updateCompanyInfo',
        'post my-company/verify-compinfo'                      : uc_path_pre + 'company.verifyCompany',
        'post fdd/verify_notify true'                          : uc_path_pre + "company.fddVerifyNotify",

        'post my-company/verify-aptitude-factory'              : uc_path_pre + 'company.verifyAptitudeFactory',
        'post my-company/verify-aptitude-design-comp'          : uc_path_pre + 'company.verifyAptitudeDesignComp',
        'post my-company/verify-aptitude-sale-comp'            : uc_path_pre + 'company.verifyAptitudeSaleComp',

        'post my-company/get-comp-aptitude true'               : uc_path_pre + 'company.getCompAptitude',

        'post my-company/get-dict-factory-service-ability'     : uc_path_pre + 'company.getDictFactoryServiceAbility',
        'post my-company/get-dict-factory-make-ability'        : uc_path_pre + 'company.getDictFactoryMakeAbility',

        'post my-company/get-dict-design-comp-service-ability' : uc_path_pre + 'company.getDictDesignCompServiceAbility',

        'post my-company/get-depts'                            : uc_path_pre + 'dept.listDept',
        'post my-company/get-dept-members'                     : uc_path_pre + 'dept.listDeptMember',
        'post my-company/search-member'                        : uc_path_pre + 'dept.searchDeptMember',
        'post my-company/add-dept'                             : uc_path_pre + 'dept.addDept',
        'post my-company/set-dept'                             : uc_path_pre + 'dept.updateDept',
        'post my-company/delete-dept'                          : uc_path_pre + 'dept.deleteDept',
        'post my-company/set-members-dept'                     : uc_path_pre + 'dept.updateUsersDept',
        'post my-company/remove-members'                       : uc_path_pre + 'dept.removeUsers',

        'post my-company/get-myinfo'                           : uc_path_pre + 'user.myInfo',
        'post my-company/get-multi-userinfo'                   : uc_path_pre + 'user.list',
        'post my-company/set-userinfo'                         : uc_path_pre + 'user.update',
        'post my-company/set-mobile'                           : uc_path_pre + 'user.updateMobile',
        'post my-company/verify-my-password'                   : uc_path_pre + 'user.verifyMyPassword',
        //'post my-company/set-password'                         : uc_path_pre + 'user.updatePassword',
        //'post my-company/search-members'                     : uc_path_pre + 'user.searchMember',

        'post my-company/get-change-manager-mobile-code'       : uc_path_pre + 'mobileCode.changeManagerCode',
        'post my-company/change-manager'                       : uc_path_pre + 'user.changeManager',

        'post my-company/create-invite-code'                   : uc_path_pre + 'invite.createInviteCode',
        'post my-company/send-invite'                          : uc_path_pre + 'invite.send',

        'post my-company/get-roles'                            : uc_path_pre + 'role.list',
        'post my-company/get-role'                             : uc_path_pre + 'role.detail',
        'post my-company/get-priv-struct'                      : uc_path_pre + 'role.privStruct',
        'post my-company/add-role'                             : uc_path_pre + 'role.add',
        'post my-company/set-role'                             : uc_path_pre + 'role.update',
        'post my-company/delete-role'                          : uc_path_pre + 'role.delete',
        'post my-company/get-role-users'                       : uc_path_pre + 'role.listUsers',
        'post my-company/set-role-users'                       : uc_path_pre + 'role.updateUsers',


        'post my-company/get-blacklists'                       : uc_path_pre + 'company.listBlacklists',
        'post my-company/delete-blacklist'                     : uc_path_pre + 'company.delBlacklist',
        'post my-company/add-blacklist'                        : uc_path_pre + 'company.addBlacklist',

        'post my-company/get-complains'                        : uc_path_pre + 'company.listComplains',
        'post my-company/delete-complain'                      : uc_path_pre + 'company.delComplain',
        'post my-company/add-complain'                         : uc_path_pre + 'company.addComplain',

        'post my-company/get-cooperated-companies'             : uc_path_pre + 'company.getCooperatedCompanies',

		'post user/verify-person-info'                         : uc_path_pre + 'user.verifyUser',
		'post fdd/verify_persion_notify true'                  : uc_path_pre + "user.fddVerifyNotify",

        'post design-comp-hall/list-comp'                      : uc_path_pre + 'designComp.listComp',
    },

    //usercenter server to server api
    'group /uc-s2s/v1/ uc-s2s': {
        'post check-mobile-code'     : ucs_path_pre + 'MobileCode.checkMobileCode',
        'post send-gov-approve-mobile-notify'     : ucs_path_pre + 'MobileCode.sendGovApproveNotify',

        'post ucan'                  : ucs_path_pre + 'user.ucan',
        'post get-my-info'           : ucs_path_pre + 'user.myInfo',
        'post get-user-info'         : ucs_path_pre + 'user.userInfo',
        'post get-multi-user-info'   : ucs_path_pre + 'user.multiUserInfo',

        'post get-comps'             : ucs_path_pre + 'comp.listComp',
        'post get-comp-info'         : ucs_path_pre + 'comp.compInfo',
        'post get-multi-comp-info'   : ucs_path_pre + 'comp.multiCompInfo',
        'post get-comp-depts'        : ucs_path_pre + 'comp.listDept',
        'post get-comp-dept-members' : ucs_path_pre + 'comp.listDeptMember', //根据企业id和部门id或者无部门或者全部部门的用户信息
        'post get-comp-members'      : ucs_path_pre + 'comp.getMembers', //根据企业id和用户id查询用户信息

        'post get-comp-aptitude'     : ucs_path_pre + 'comp.getCompAptitude',

        'post plat-user-register'      : ucs_path_pre + 'platAdmin.register',
        'post plat-user-send-passwd'      : ucs_path_pre + 'platAdmin.sendRandPass',
        'post plat-user-login'         : ucs_path_pre + 'platAdmin.login',
        //'post plat-user-reset-passwd'  : ucs_path_pre + 'platAdmin.resetPasswd',
        'post plat-user-modify-passwd' : ucs_path_pre + 'platAdmin.modifyPasswd',
        'post plat-user-join-comp'     : ucs_path_pre + 'platAdmin.joinComp',
        'post plat-user-quit-comp'     : ucs_path_pre + 'platAdmin.quitComp',
    },

	//usercenter-admin
    'group /uc-adm/v1/ all-adm': {
        'post dict-aptitude/list-aptitude': uc_adm_path_pre + 'aptitudeDict.list',
        'post dict-aptitude/update-aptitude-field': uc_adm_path_pre + 'aptitudeDict.updateField',

        'post dict-factory-ability/list-ability': uc_adm_path_pre + 'factoryAbility.listAbility',
        'post dict-factory-ability/add-ability': uc_adm_path_pre + 'factoryAbility.addAbility',
        'post dict-factory-ability/update-ability': uc_adm_path_pre + 'factoryAbility.updateAbility',
        'post dict-factory-ability/del-ability': uc_adm_path_pre + 'factoryAbility.delAbility',

        'post dict-factory-ability/list-quota': uc_adm_path_pre + 'factoryAbility.listQuota',
        'post dict-factory-ability/add-quota': uc_adm_path_pre + 'factoryAbility.addQuota',
        'post dict-factory-ability/update-quota': uc_adm_path_pre + 'factoryAbility.updateQuota',
        'post dict-factory-ability/del-quota': uc_adm_path_pre + 'factoryAbility.delQuota',

        'post dict-factory-zone/list-zone': uc_adm_path_pre + 'factoryZone.list',
        'post dict-factory-zone/add-zone': uc_adm_path_pre + 'factoryZone.add',
        'post dict-factory-zone/update-zone': uc_adm_path_pre + 'factoryZone.update',

        'post factory/list-factory': uc_adm_path_pre + 'factory.list',


        'post comp/count': uc_adm_path_pre + 'comp.count',
        'post comp/index': uc_adm_path_pre + 'comp.index',
        'post comp/show': uc_adm_path_pre + 'comp.show',

        'post reg-comp-account'     : uc_adm_path_pre + 'user.regCompAccount',
	},

	////////////////////// product center ///////////////////////
    //productcenter server to client api
    'group /pc/v1/ pc-s2c': {
		//'group contract': {
        //    'post list-contract-tpl': pc_path_pre + 'contractTpl.listContractTpl',
        //    'post get-contract-info': pc_path_pre + 'contract.detailContract',
		//},
		//
        'all merge-dict true'                             : pc_path_pre + 'dictMerge.getDict',

		//'group product-set'          : {
		//	//套系，已无功能，待去掉
		//	'post list-set'          : pc_path_pre + 'set.listSet',
		//	'post add-set'           : pc_path_pre + 'set.addSet',
		//	'post update-set'        : pc_path_pre + 'set.updateSet',
		//	'post del-set'           : pc_path_pre + 'set.delSet',

		//	'post list-set-product'  : pc_path_pre + 'set.listSetProduct',
		//	'post remove-from-set'   : pc_path_pre + 'set.removeFromSet',
		//	'post move-to-set'       : pc_path_pre + 'set.moveToSet',

		//	'post get-multi-set-info true' : pc_path_pre + 'set.infoMultiSet',
		//	'post list-comp-set-info true' : pc_path_pre + 'set.listCompSet',
		//	'post list-child-set-info true' : pc_path_pre + 'set.listChildSet',
		//},

        'group product': {
			//套系
            //'post list-set'                   : pc_path_pre + 'set.listSet',
            //'post add-set'                    : pc_path_pre + 'set.addSet',
            //'post update-set'                 : pc_path_pre + 'set.updateSet',
            //'post del-set'                    : pc_path_pre + 'set.delSet',

            //'post list-set-product'           : pc_path_pre + 'set.listSetProduct',
            //'post remove-from-set'            : pc_path_pre + 'set.removeFromSet',
            //'post move-to-set'                : pc_path_pre + 'set.moveToSet',

            'post get-nproduct-by-cat-attr true' : pc_path_pre + 'factoryComp.getNproductByCatAttrNo',
            'post get-nproduct-by-color true'    : pc_path_pre + 'factoryComp.getNproductByColorNo',
            'post get-nproduct-by-material true' : pc_path_pre + 'factoryComp.getNproductByMaterialNo',
            'post get-nproduct-by-style true'    : pc_path_pre + 'factoryComp.getNproductByStyleNo',

			//商品合同模板
            //'post list-contract-tpl'        : pc_path_pre + 'contractTpl.listContractTpl',
		},

		'group designer': {
            'post init-set-id'           : pc_path_pre + 'designProduct.initSetId',
            'post add-or-update-set'     : pc_path_pre + 'designProduct.addOrUpdateSet',
            'post multi-update-set'      : pc_path_pre + 'designProduct.multiUpdateSet',

            'post add-or-update-product' : pc_path_pre + 'designProduct.addOrUpdateProduct',
            'post multi-update-product'  : pc_path_pre + 'designProduct.multiUpdateProduct',

            'post list-product'          : pc_path_pre + 'designProduct.listProduct',
            'post list-set'              : pc_path_pre + 'designProduct.listSet',
            'post detail-product'        : pc_path_pre + 'designProduct.detailProduct',
            'post detail-set'            : pc_path_pre + 'designProduct.detailSet',
            'post trash-product'         : pc_path_pre + 'designProduct.trashProduct',
            'post untrash-product'       : pc_path_pre + 'designProduct.unTrashProduct',
            'post del-product'           : pc_path_pre + 'designProduct.delProduct',
            'post trash-set'             : pc_path_pre + 'designProduct.trashSet',
            'post untrash-set'           : pc_path_pre + 'designProduct.unTrashSet',
            'post del-set'               : pc_path_pre + 'designProduct.delSet',
            'post del-set-product'       : pc_path_pre + 'designProduct.delSetProduct',

            'post list-product-order'    : pc_path_pre + 'designProduct.listDesignProductOrder',

            //'post add-price-product': pc_path_pre + 'designPriceProduct.addPriceProduct',
            //'post list-price-product': pc_path_pre + 'designPriceProduct.listPriceProduct',
            //'post detail-price-product': pc_path_pre + 'designPriceProduct.detailPriceProduct',
            //'post update-price-product': pc_path_pre + 'designPriceProduct.updatePriceProduct',
            //'post toggle-price-product': pc_path_pre + 'designPriceProduct.togglePriceProduct',
            //'post del-price-product': pc_path_pre + 'designPriceProduct.delPriceProduct',
            //'post undel-price-product': pc_path_pre + 'designPriceProduct.undelPriceProduct',
            //'post sign-price-product': pc_path_pre + 'designPriceProduct.signProductContract',
            //'post notify-sign-price-product true': pc_path_pre + 'designPriceProduct.fddSignNotifyPriceProduct',
            //'post check-paid-price-product': pc_path_pre + 'designPriceProduct.checkPaidPriceProduct',

            'post add-percent-product': pc_path_pre + 'designPercentProduct.addPercentProduct',
            'post list-percent-product': pc_path_pre + 'designPercentProduct.listPercentProduct',
            'post detail-percent-product': pc_path_pre + 'designPercentProduct.detailPercentProduct',
            'post update-percent-product': pc_path_pre + 'designPercentProduct.updatePercentProduct',
            'post toggle-percent-product': pc_path_pre + 'designPercentProduct.togglePercentProduct',
            'post del-percent-product': pc_path_pre + 'designPercentProduct.delPercentProduct',
            'post undel-percent-product': pc_path_pre + 'designPercentProduct.undelPercentProduct',
            'post end-percent-product': pc_path_pre + 'designPercentProduct.terminatePercentProduct',
		},

		'group factory'                          : {
            'post list-design-product-order'              : pc_path_pre + 'factoryDesignOrder.listDesignProductOrder',
            'post list-design-set-order'              : pc_path_pre + 'factoryDesignOrder.listDesignSetOrder',

            'post add-self-product'              : pc_path_pre + 'factorySelfProduct.addSelfProduct',
            'post list-self-product'             : pc_path_pre + 'factorySelfProduct.listSelfProduct',
            'post detail-self-product'           : pc_path_pre + 'factorySelfProduct.detailSelfProduct',
            'post update-self-product'           : pc_path_pre + 'factorySelfProduct.updateSelfProduct',
            'post multi-update-self-product'           : pc_path_pre + 'factorySelfProduct.multiUpdateSelfProduct',
            'post del-self-product'              : pc_path_pre + 'factorySelfProduct.delSelfProduct',
            'post undel-self-product'            : pc_path_pre + 'factorySelfProduct.undelSelfProduct',

            //'post toggle-self-product'         : pc_path_pre + 'factorySelfProduct.toggleSelfProduct',
            'post toggle-market-self-product'    : pc_path_pre + 'factorySelfProduct.toggleMarketSelfProduct',
            'post toggle-salebook-self-product'  : pc_path_pre + 'factorySelfProduct.toggleSalebookSelfProduct',

            'post set-product-step-price'        : pc_path_pre + 'factoryComp.setProductStepPrice',
            'post set-product-sample-img'        : pc_path_pre + 'factoryComp.setProductSampleImg',

            'post query-spu-sku true'           : pc_path_pre + 'factoryComp.querySpuSku',
            'post query-sku-spu true'           : pc_path_pre + 'factoryComp.querySkuSpu',

            'post list-price-product'            : pc_path_pre + 'factoryPriceProduct.listPriceProduct',
            'post detail-price-product'          : pc_path_pre + 'factoryPriceProduct.detailPriceProduct',
            //'post pay4-price-product'          : pc_path_pre + 'factoryPriceProduct.payForPriceProduct',
            //'post payback4-price-product true' : pc_path_pre + 'factoryPriceProduct.paybackForPriceProduct',

            'post list-percent-product'          : pc_path_pre + 'factoryPercentProduct.listPercentProduct',
            'post detail-percent-product'        : pc_path_pre + 'factoryPercentProduct.detailPercentProduct',
            'post end-percent-product'           : pc_path_pre + 'factoryPercentProduct.terminatePercentProduct',

            'post list-agency-group'            : pc_path_pre + 'factoryAgency.listAgencyGroup',
            'post add-agency-group'            : pc_path_pre + 'factoryAgency.addAgencyGroup',
            'post update-agency-group'         : pc_path_pre + 'factoryAgency.updateAgencyGroup',
            'post del-agency-group'            : pc_path_pre + 'factoryAgency.delAgencyGroup',
            'post apply-agency'            : pc_path_pre + 'factoryAgency.applyAgency',
            'post stat-agency'            : pc_path_pre + 'factoryAgency.statAgency',
            'post list-agency-by-group'            : pc_path_pre + 'factoryAgency.listAgencyByGroup',

            'post add-product-to-agency-group' : pc_path_pre + 'factoryAgency.addProductToAgencyGroup',
            'post get-product-agency-group' : pc_path_pre + 'factoryAgency.getProductAgencyGroup',
            'post list-agency-group-product' : pc_path_pre + 'factoryAgency.listProductByAgencyGroup',
		},

        'group seller': {
            'post list-agency'            : pc_path_pre + 'sellerAgency.listAgency',
            'post list-agency-group-product' : pc_path_pre + 'sellerAgency.listProductByAgencyGroup',
		},

        //'post list-agency-group-product-set' : pc_path_pre + 'factoryAgency.listProductSetByAgencyGroup',

		'group design-market': {
            'post list-product'        : pc_path_pre + 'DesignProductMarket.listProduct',
            'post list-set'            : pc_path_pre + 'DesignProductMarket.listSet',
            'post detail-product true' : pc_path_pre + 'DesignProductMarket.detailProduct',
            'post detail-set'          : pc_path_pre + 'DesignProductMarket.detailSet',
            'post buy-product'         : pc_path_pre + 'DesignProductMarket.buyProduct',
            'post buy-set'             : pc_path_pre + 'DesignProductMarket.buySet',
	
            'post list-percent-product'   : pc_path_pre + 'designMarket.listPercentProduct',
            'post detail-percent-product' : pc_path_pre + 'designMarket.detailPercentProduct',

            'post sign-percent-product'   : pc_path_pre + 'designMarket.buyPercentProduct',

            //'post list-price-product': pc_path_pre + 'designMarket.listPriceProduct',
            //'post detail-price-product': pc_path_pre + 'designMarket.detailPriceProduct',
            //'post detail-price-product-base true': pc_path_pre + 'designMarket.detailPriceProductBase',

            //'post buy-price-product': pc_path_pre + 'designMarket.buyPriceProduct',
            //'post sign-price-product': pc_path_pre + 'designMarket.signPriceProduct',
            //'post notify-sign-price-product true': pc_path_pre + 'designMarket.signNotifyPriceProduct',
            //'post notify-price-product-order true': pc_path_pre + 'designMarket.priceProductOrderNotify',
		},

        'group salebook': {
            'post list-product-by-cat true'    : pc_path_pre + 'salebook.listProductByCat',
            'post search-product true'         : pc_path_pre + 'salebook.searchProduct',
            'post detail-product true'         : pc_path_pre + 'salebook.detailProduct',
            'post add-comp-shared-statistics'  : pc_path_pre + 'salebook.addShareStatistics',
            'post list-comp-shared-statistics' : pc_path_pre + 'salebook.listShareStatistics',

            'post get-qr-code'                 : pc_path_pre + 'salebook.getAppQrCode',
        },

        'group factory-market': {
            'post list-factory'        : pc_path_pre + 'factoryMarket.listFactory',
            'post create-waybill'      : pc_path_pre + 'factoryMarket.createWayBill',
            'post get-waybill'         : pc_path_pre + 'factoryMarket.getWayBill',
            'post query-order-waybill' : pc_path_pre + 'factoryMarket.isOrderWayBill',
            'post track-waybill'       : pc_path_pre + 'factoryMarket.queryWayBillTrack',
		},

        'group fav': {
            'post add-fav': pc_path_pre + 'fav.addFav',
            'post del-fav': pc_path_pre + 'fav.delFav',
            'post list-fav': pc_path_pre + 'fav.listFav',
            'post stat-fav': pc_path_pre + 'fav.statFav',
		},
	},

	//productcenter-admin
    'group /pc-adm/v1/ all-adm': {
        'post factory/list-product'            : pc_adm_path_pre + 'factoryProduct.list',
        'post factory/statistics-product'      : pc_adm_path_pre + 'factoryProduct.statistics',
        'post factory/market-order-n-by-style' : pc_adm_path_pre + 'factoryProduct.saleOrderStyleStatistics',
	},

    'group /for-test-only/ true': {
		'get create-captcha true': 'test.createCaptcha',
	},

    'group /cc123sh-sadmin/ sadmin': {
		'post add-init-user': 'sadmin.addUser',
		'post get-need-verify-by-mobiles': 'sadmin.getNeedVerifyByMobiles',
		'post pass-verify-company-by-mobile': 'sadmin.passVerifyCompanyByMobile',

        //上传模板到法大大
        //'post upload-contract-tpls': 'sadmin.uploadContractTpl'
	},

	////////////////////// portal ///////////////////////
    'group /portal/v1/ true': {
		'post factory-list-filter': pt_path_pre + 'factory.listFilter',
		'post factory-filter': pt_path_pre + 'factory.filterCompany',
		'post factory-search': pt_path_pre + 'factory.searchCompany',

		'post design-comp-list-filter': pt_path_pre + 'design.listFilter',
		'post design-comp-filter': pt_path_pre + 'design.filterCompany',
		'post design-comp-search': pt_path_pre + 'design.searchCompany',
	},


	'post /api/offline/pay true': 'test.offlinePay',
	'post /api/offline/confirm true': 'test.offlineConfirm',
};

