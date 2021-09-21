# Kuberenetes & NodeJS

An Express app deployed as a container in Kubernetes.

## 0. Basic setup

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

## 1. Creating and retrieving notes

The form for creating notes is defined in the index.pug template. It handles both the creation of notes and uploading of pictures. You should use `Multer`, a middleware for multi-part form data, to handle the uploaded data.

- `$ npm i multer`
- [Multer npm](https://www.npmjs.com/package/multer)

## 2. Rendering Markdown to HTML

The Markdown notes should be rendered to HTML so that you can read them properly formatted. `Marked` is an excellent engine for rendering Markdown to HTML.

- `$ npm i marked`
- [Marked npm](https://www.npmjs.com/package/marked)

## 3. Uploading pictures

When a user uploads a picture, the file should be saved on disk/app directory (e.g. `public/uploads`), and a link should be inserted in the text box.

## 4. Deploying apps with containers

You could deploy you app in different ways:

- [The hard way] Provisioning your own `VPS`, install nvm, create the appropriate users, configure `Node.js` as well as `PM2` to restart the app when it crashes and `Nginx` to handle TLS and path-based routing;
- Using Platform as a Service (PaaS) like `Heroku` and forget about the underlying infrastructure and dependencies;
- Packaging applications as Linux containers and deploying them to specialised container platforms. Typically, a container contains a single process and its dependencies.

  ### 4.1. Linux containers

  Containers are different from virtual machines:

  - The process in a container still executes on the kernel of the host machine.
  - With virtual machines, you run an entire guest operating system on top of your host operating system, and the processes that you want to execute on top of that.
  - Containers are much more lightweight than virtual machines.

  The magic of containers comes from two features in the Linux kernel:

  - `Control groups` (cgroups): limit the resources a process can use, such as memory and CPU.
  - `Namespaces`: limit what a process can see.

  ### 4.2. Containerising the app

  **Docker containers** are built from `Dockerfiles` that defines what goes in a container ([reference](https://docs.docker.com/engine/reference/builder/)). Example:

  ```dockerfile
  FROM node:12.0-slim
  COPY . .
  RUN npm install
  CMD [ "node", "index.js" ]
  ```

  - `FROM` defines the base layer for the container, in this case, a version of Ubuntu with Node.js installed
  - `COPY` copies the files of your app into the container
  - `RUN` executes npm install inside the container
  - `CMD` defines the command that should be executed when the container starts

  You can build a container/**Docker image** from your app with the following command: `$ docker build -t knote .` Where:

  - `-t knote` defines the name/tag of your container, e.g. `knote`
  - `.` is the location of the Dockerfile and application code, e.g., the current directory

  A **Docker image** is an archive containing all the files that go in a container. You can create many Docker containers from the same Docker image. You can list all the images on your system with the following command: `$ docker images`.

  **Docker Hub** is a container registry — a place to distribute and share container images.

  ### 4.3. Running the container

  Previously, you installed MongoDB on your machine and ran it with the `mongod` command. You could do the same but as a container.
  MongoDB is provided as a Docker image named **mongo** on Docker Hub. However, the `knote` and `mongo` cointainers should communicate with each other, being on the same **Docker network** ([reference](https://docs.docker.com/network/)).

  - Create a new _Docker network_: `$ docker network create knote`

  - Run _MondoDB_: `$ docker run --name=mongo --rm --network=knote mongo` where:

    - `--name` defines the name for the container. If you don't specify it, a name will be auto-generated;
    - `--rm` automatically cleans up the container and removes the file system when the container exits;
    - `--network` represents the `Docker network` in which the container should run. If it's omitted, the container runs in the default network;
    - `mongo` is the name of the Docker image that you want to run.

  - Run the _Knote_ app: `$ docker run --name=knote --rm --network=knote -p 3000:3000 -e MONGO_URL=mongodb://mongo:27017/dev knote` where:

    - `-p 3000:3000` publishes port `3000` of the container to port `3000` of your local machine. That means, if you now access port `3000` on your computer, the request is forwarded to port `3000` of the Knote container. You can use the forwarding to access the app from your local machine;
    - `-e` sets an environment variable inside the container. **IMPORTANT**: the hostname is `mongo` which is precisely the name that you gave to the MongoDB container with the `--name=mongo flag`.

  - Useful commands:
    - Display all running containers: `$ docker ps`
    - Stop the containers: `$ docker stop mongo knote`
    - Remove the containers: `$ docker rm mongo knote`

  ### 4.4. Uploading the container image to a container registry

  You could create your images and upload them to _DockerHub_. Once you have your Docker ID, you have to authorise Docker to connect to the Docker Hub account: `$ docker login`

  Images uploaded to Docker Hub must have a name of the form `username/image:tag`:

  - `username` is your Docker ID;
  - `image` is the name of the image;
  - `tag` is an optional additional attribute — often it is used to indicate the version of the image.

  Example:

  - Rename: `$ docker tag knote <username>/knote-js:1.0.0`
  - Upload: `$ docker push <username>/knote-js:1.0.0`

  Your image is now publicly available as `<username>/knote-js:1.0.0` on Docker Hub and everybody can download and run it. To verify this, you can re-run your app, but this time using the new image name:

  - `$ docker run --name=mongo --rm --network=knote mongo`
  - `$ docker run --name=knote --rm --network=knote -p 3000:3000 -e MONGO_URL=mongodb://mongo:27017/dev <username>/knote-js:1.0.0`

  Once you're done testing your app, you can stop and remove the containers with: `$ docker stop mongo knote`
