FROM node:14.14.0-alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
# The only difference between this prod dockerfile and the .dev one is the start
# command instruction below.
# the "start" script below comes from our package,json file, and is set as
# "node index.js",
CMD [ "npm", "start" ]
