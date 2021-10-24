FROM node:16.11-alpine3.11
WORKDIR /workdir
RUN yarn global add @google/clasp
COPY package.json yarn.lock /workdir/
RUN yarn install
