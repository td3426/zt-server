

module.exports.dict = {

    //公司类型
    componyType: (() => {
        let $ret = {};

        $ret[CONST.COMPONY_TYPE_FURNITURE_FACTORY]  = '家具工厂';
        $ret[CONST.COMPONY_TYPE_FURNITURE_DESIGNER] = '设计公司';
        $ret[CONST.COMPONY_TYPE_FURNITURE_SELL]     = '销售公司';
        $ret[CONST.COMPONY_TYPE_SUPPLY]             = '供应商';
        $ret[CONST.COMPONY_TYPE_SHIPPING]           = '物流公司';
        $ret[CONST.COMPONY_TYPE_FINANCE]            = '金融服务公司';

        return $ret;
    })(),

    //合同模板强制参数
    contractTplSysParams: (() => {
        let $ret = {
            side_a: '',
            side_b: '',
            sign_date: '',
            amount: ''
        };

        return $ret;
    })(),

};
