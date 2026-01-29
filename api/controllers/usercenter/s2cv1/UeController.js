const moment = require('moment');
const flaverr = require('flaverr');

var path = require('path');

module.exports = {

    handle: async function (req, res) {
        moment.locale('zh-cn');
        var $relativePath = moment().format('YYYYMMDD');

        req.file('upfile').upload({
            dirname: path.resolve(sails.config.custom.uimgPath, $relativePath),
            maxBytes: 10000000
        },function (err, uploadedFiles) {
            if (err) return res.jsonerr(err.get);

            if(uploadedFiles.length < 1) return res.jsonerr('请选择要上传的文件');

            $url = path.resolve('/', $relativePath, path.basename(uploadedFiles[0].fd));

            // sails.log.debug(uploadedFiles);

            return res.jsonok({
                state: 'SUCCESS',
                url: $url
            });
        });

    }

};
