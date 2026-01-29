#!/bin/sh

urllist="scripts/data/uri/ok.txt"
savefolder="scripts/data/ganzhou-jiaju-gongchang"
IFS=$'\n'
n=1
for line in $(cat ${urllist}); do
	echo "当前第${n}个"
	if [ ! -f "${savefolder}/${line}.html" ];then
		./node_modules/phantomjs/lib/phantom/bin/phantomjs --ignore-ssl-errors=true --load-images=false scripts/qixinbao.detail.js ${line} ${savefolder} 2>&1 >> scripts/qixinbao.detail.log
		sleep $(($RANDOM % 6 + 3))
	fi
	let n+=1
done
