FROM node:21.4.0
WORKDIR /user/src/app
COPY package*.json index.js auth.json index.html ./
RUN npm install
EXPOSE 9999
CMD ["npm", "run", "dev"]