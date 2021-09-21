# Kuberenetes & NodeJS

An Express app deployed as a container in Kubernetes.

## Basic setup

1. ESLint, Prettier & Airbnb Setup
   - `$ npm i -D eslint prettier eslint-plugin-prettier eslint-config-prettier eslint-plugin-node eslint-config-node`
   - `$ npx install-peerdeps --dev eslint-config-airbnb`
   - Reference:
     - [ESLint Rules](https://eslint.org/docs/rules/)
     - [Prettier Options](https://prettier.io/docs/en/options.html)
     - [Airbnb Style Guide](https://github.com/airbnb/javascript)
2. Express, Pug and Tachyons
   - `$ npm i express pug`
   - [Tachyons](https://tachyons.io/)
3. MongoDB
   - [Server](https://docs.mongodb.com/guides/server/install/)

## Creating notes

The form for creating notes is defined in the index.pug template. It handles both the creation of notes and uploading of pictures. You should use `Multer`, a middleware for multi-part form data, to handle the uploaded data.

- `$ npm i multer`
- [Multer npm](https://www.npmjs.com/package/multer)
