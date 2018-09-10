FROM mhart/alpine-node:latest

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install The Required Packages
RUN yarn

# Build The Static Files
RUN yarn run build

# Delete The Uncompiled Files
RUN rm -rf html/

EXPOSE 80
CMD [ "yarn", "start" ]
