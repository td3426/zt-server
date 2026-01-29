function responseError(response, err, res) {
    console.log('err:', err);
    let msg = typeof err == "string" ? err : typeof err.msg != 'undefined' ? err.msg : typeof err.message != 'undefined' ? err.message : "出错了";
    res.set({'content-type': 'text/html'});
    res.send("<html lang=\"cn\"><head><meta charset=\"utf-8\"></head><body><pre style='white-space: pre-wrap; word-wrap: break-word; word-break: break-all;'>" + response.replace(/&/g, "&amp;") + msg+ "</pre></body></html>");
};

module.exports = {

    test1: async function (req, res){
    
        var fdd = Fadada.create();
        var response = '';
    
        try {
            var ret = await fdd.genContract(3, 128, "测试买卖合同", {
                side_a: '上海齐家设计公司',
                side_b: '上海中贸家具有限公司',
                sign_date: '2019-11-13',
                amount: 8000,
                handsel: 1000
            });

            return res.jsonok(ret);

        } catch(err) { return responseError(response, err, res); }

    },

    test2: async function (req, res){
        var fdd = Fadada.create();
        var response = '';
    
        try {
            var ret = await fdd.signContract(
                12128, 
                128, 
                '5000288E4B7FAE80DD5ABE4C735B3526', 
                '测试买卖合同', 
                sails.config.custom.baseUrl + sails.getUrlFor('test.test2return'),
                sails.config.custom.baseUrl + sails.getUrlFor('test.test2callback')
            );

            return res.jsonok(ret);

        } catch(err) { return responseError(response, err, res); }

    },

    test2return: async function (req, res){
        var $params = req.allParams();
        sails.log.debug('fddSignReturn: ', $params);

        // fddSignReturn:  { transaction_id: '12123',
        //     timestamp: '20191104130529',
        //     result_code: '3000',
        //     msg_digest: 'MzU4NENCQjg4RDRCNkVDNzk1QTY4RkVBNkQyQUZDNTM3NEZDOTdBQQ==',
        //     download_url:
        //     'https://testapi.fadada.com:8443/api//getdocs.action?app_id=402509&timestamp=20191104130442&v=2.0&msg_digest=Q0EyMzIwMjA2NUM0RDA3QzkzQ0U3N0QzODg1MjlFRjVCRkFDMUMzRg==&send_app_id=null&transaction_id=12123',
        //     viewpdf_url:
        //     'https://testapi.fadada.com:8443/api//viewdocs.action?app_id=402509&timestamp=20191104130442&v=2.0&msg_digest=Q0EyMzIwMjA2NUM0RDA3QzkzQ0U3N0QzODg1MjlFRjVCRkFDMUMzRg==&send_app_id=null&transaction_id=12123',
        //     result_desc: '签署成功' 
        // }

        return res.jsonok('ok');

    },

    test2callback: async function (req, res){
        var $params = req.allParams();
        sails.log.debug('fddSignNotify: ', $params);

        // fddSignNotify:  { transaction_id: '12126',
        //     contract_id: '126',
        //     timestamp: '20191104144042',
        //     result_code: '3000',
        //     result_desc: '已经签署成功，请勿重复签署',
        //     msg_digest: 'NDI1MzM1MDkwNjlFNzdFNzBEMTE3NTZFNzFFMkMxNDIxMzRDNjE1Mg==',
        //     download_url: '',
        //     viewpdf_url: '' 
        // }

        return res.jsonok('ok');

    },

	testGetFile: async function(req, res) {
        var fdd = Fadada.create();
		sails.log.debug(await fdd.getFileByUUID('8ef0dff5ab9d413e903c449d1d0f7040'));
		return res.jsonok('ok');
	},

	testpp: async function(req, res) {
		sails.log.debug(await User.find());
		return res.jsonok('ok');
	},

	testSaveContent: async function(req, res) {
		sails.log.debug('-----------------------------------------------');
		sails.log.debug(req.param('id'));
		sails.log.debug(req.param('data'));
		return res.jsonok('ok');
	},

	createCaptcha: async function(req, res) {
		var ret = cutil.createCaptcha();
		return res.jsonok({
			captcha: ret.text,
			captcha_token: ret.token
		});
	},
	
	offlinePay: async function(req, res) {
		console.log(req.allParams());
		return res.jsonok({
			id: 'payok123'
		});
	},

	offlineConfirm: async function(req, res) {
		return res.ok('confirm ok');
	},

	testUplode: async function(req, res) {
		var $file_uploader = new FileApi();
		var $file_info = await $file_uploader.getUploadUrl("test/abc/aa.jpg");

		//$file_info.filename;
		//$file_info.url
		
		await $file_uploader.uploadFile($file_info.url, require('fs').readFileSync('a.jpg'));
		//await $file_uploader.uploadFile($file_info.url, Buffer.from('abc 啊哈哈 file content ccc'));

		return res.jsonok('http://cdn.file.nk.emergen.cn/' + $file_info.filename);
	},

};
