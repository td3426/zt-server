const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio')

function parseDetail(id, ct) {
	sails.log.debug('parse: ' + id);

	if(!ct) throw new Error(filePath + ' has no content');
	var $ = cheerio.load(ct);
	var row = {};
	var contact = $('.contact .content > div:first-of-type');
	var gs = $('#regInfo .company-section-main > div');
	var intro = $('#entDesc .company-section-main');

	if($('.content-name').length != 1) throw new Error('row.name not found');
	if(contact.length != 4) throw new Error('row.contact not found');
	if(gs.length != 13) throw new Error('reg info not corect');

	row.name = $('.content-name').text().trim();
	row.tel1 = contact.eq(0).text().trim();
	row.mail = contact.eq(1).text().trim();
	row.mail = row.mail.length > 2 ? row.mail : '';
	if(row.tel1 == '****') row.tel1 = '';
	if(
		row.tel1.length >= 11 
		&& row.mail.length >= 11 
		&& row.tel1.substr(0, 7) == row.mail.substr(0, 7)
	) row.tel1 = row.mail.substr(0, 11);
	row.site = contact.eq(2).text();
	row.site = typeof row.site != 'undefined' && row.site && row.site.length > 2 ? row.site : '';
	row.addr = contact.eq(3).text();

	var kmap = ['legalName', 'openStat', 'startDate', 'regCapital', 'trade', 'corpType', 'corpIdCode', 'creditIdCode', 'regIdcode', 'openTimeval', 'permitDate', 'regGov', 'scope'];
	if(gs.length != kmap.length) throw new Error('filed count not correct');

	for(i = 0; i < gs.length; i ++) {
		var v = '';
		//gs.eq(i).find('span').text();
		if(i == 0) {
			v = gs.eq(i).find('div > a');
			v = v.length ? v.eq(0).text() : '';
		} else {
			v = gs.eq(i).find('div');
			v = v.length ? v.eq(0).text() : '';
		}
		row[kmap[i]] = v;
	}

	if(intro.length > 0) {
		row.intro = intro.eq(0).text();
	}

	row.qxbId = id;
	return row;
}

module.exports = {
    friendlyName: 'parse detail',
    description: '',
    inputs: {},

	fn: async function (inputs, exits) {
		try {
			var foldPath = '../data/ganzhou-jiaju-gongchang';
			var files = fs.readdirSync(foldPath);
			var i, filePath, fileStat, len = files.length;
			if(!len) throw new Error('no file found');

			var ct = null, row = {};
			for(i = 0; i < len; i ++) {
				filePath = path.join(foldPath, '/', files[i]);
				fileStat = fs.statSync(filePath);
				if(!fileStat.isFile()) throw new Error(filePath + ' is not a file');
				ct = fs.readFileSync(filePath, 'utf8');
				if(ct == '404') continue;
				row = await parseDetail(files[i].substr(0, files[i].length - 5), ct);
				await CrmResourceCompany.create(row);
			}
		} catch(err) {
			sails.log.error(err);
			return exits.error(err);
		}

        return exits.success();
    }
};
