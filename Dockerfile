FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --unsafe-perm=true --allow-root
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

#RUN chmod 755 .

EXPOSE 80
EXPOSE 90
CMD [ "node", "api/server.js", "--rpc", "wss://ropsten.infura.io/ws/v3/963c4b374f2942338c281f97a61d8d98" ]