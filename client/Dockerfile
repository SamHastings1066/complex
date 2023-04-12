FROM node:16-alpine as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
EXPOSE 3000
# Copy over our specific nginx conf file and replace the default one installed
# with the base image
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# the folder /app/build is where the production assets built by the npm run
# build command are stored
COPY --from=builder /app/build /usr/share/nginx/html
