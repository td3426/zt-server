#!/bin/sh

#江西赣州制造业家具制造业经营范围家具
url="https://www.qixin.com/search?area.city=3607&area.province=36&industry.l1=C0000&industry.l2=C2100&key=%E5%AE%B6%E5%85%B7&scope[]=6"
step=1
savefolder="ganzhou-jiaju-zhizao"

for((i=488; i<=500; i+= ${step}));
do   
	echo "start: ${url} ${i} ${step} ${savefolder}"
	./node_modules/phantomjs/lib/phantom/bin/phantomjs --cookies-file="scripts/cookies.txt" --ignore-ssl-errors=true --load-images=false scripts/qixinbao.js ${url} ${i} ${step} ${savefolder} 2>&1 >> scripts/qixinbao.log
	sleep 10
done 
exit

echo 'done'

#./node_modules/phantomjs/lib/phantom/bin/phantomjs --cookies-file="scripts/cookies.txt" --ignore-ssl-errors=true --load-images=false scripts/qixinbao.js 
#./node_modules/phantomjs/lib/phantom/bin/phantomjs --debug=true --cookies-file=cookies.txt --ignore-ssl-errors=true --load-images=false scripts/qixinbao.js 
