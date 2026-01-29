FROM keymetrics/pm2:latest-alpine

COPY . /app/

WORKDIR /app

RUN npm install

EXPOSE 8012

CMD sh server.sh

