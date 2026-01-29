#!/bin/sh

xnpm="$(which npm)"
xnode="$(which node)"
xcur=$(cd "$(dirname "$0")";pwd)
xpm2="$(which pm2)"
xpm2node="${xcur}/node_modules/pm2/bin/pm2"
logpath="/logs"

if test -z ${xnpm}; then
	echo "npm not found"
	exit 1
fi

if test -z ${xnode}; then
	echo "node not found"
	exit 1
fi

if test -z ${xcur}; then
	echo "pwd not found"
	exit 1
fi

if test -z ${xpm2}; then
	xpm2 = ${xpm2node}
fi

if [ ! -d ${logpath} ]; then
	mkdir -p ${logpath}
fi
if [ ! -d ${logpath} ]; then
	echo "can't create ${logpath}"
	exit 1
fi

${xnpm} --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/dist --phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs/ install

nodenv=production
echo "{ \"apps\": [ { \"name\": \"usercenter-prod\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 5, \"script\": \"./app.js\", \"log_file\": \"${logpath}/usercenter-prod.log\" }, { \"name\": \"uc-loop-check-prod\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"loop-check\"], \"log_file\": \"${logpath}/uc-loop-check-prod.log\" }, { \"name\": \"uc-notify-trans-prod\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"notify-trans\"], \"log_file\": \"${logpath}/uc-notify-trans-prod.log\" }, { \"name\": \"uc-notify-need-product\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"notify-need-product\"], \"log_file\": \"${logpath}/uc-notify-need-product.log\" }, { \"name\": \"uc-notify-custom-cat\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"notify-custom-cat\"], \"log_file\": \"${logpath}/uc-notify-custom-cat.log\" }, { \"name\": \"uc-notify-product-cat-attr\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"notify-product-cat-attr\"], \"log_file\": \"${logpath}/uc-notify-product-cat-attr.log\" }, { \"name\": \"uc-notify-product-cat-attr-val\", \"env\": { \"NODE_ENV\": \"${nodenv}\" }, \"cwd\": \"${xcur}\", \"instances\": 1, \"script\": \"./node_modules/sails/bin/sails.js\", \"args\": [\"run\", \"notify-product-cat-attr-val\"], \"log_file\": \"${logpath}/uc-notify-product-cat-attr-val.log\" }] }" > pm2.json

${xpm2} restart "${xcur}/pm2.json" 

sleep 5 && tail -n100 -f ${logpath}/*
