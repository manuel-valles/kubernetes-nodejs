# Kuberenetes & NodeJS

An Express app deployed as a container in Kubernetes.

## 0. Basic setup

- ESLint, Prettier & Airbnb Setup
  - `$ npm i -D eslint prettier eslint-plugin-prettier eslint-config-prettier eslint-plugin-node eslint-config-node`
  - `$ npx install-peerdeps --dev eslint-config-airbnb`
  - Reference:
    - [ESLint Rules](https://eslint.org/docs/rules/)
    - [Prettier Options](https://prettier.io/docs/en/options.html)
    - [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Express, Pug and Tachyons

  - `$ npm i express pug`
  - [Tachyons](https://tachyons.io/)

- MongoDB
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

## 5. Deploying NodeJS apps in a local Kubernetes cluster

If you use Docker containers and wish to deploy your app into production, you might have a few options:

- Run the container in the server manually with a `docker run`;
- Use a tool such as `docker-compose` to run and manage several containers at the same time;
- Use a `container orchestrator`. A tool designed to manage and run containers at scale.

  ### 5.1. Container orchestrators

  **Container orchestrators** are designed to run complex applications with large numbers of scalable components. They work by inspecting the underlying infrastructure and determining the best server to run each container.
  **Kubernetes** is an excellent choice to deploy your containerised application, mainly because:

  - `Open-source`: you can download and use it without paying any fee;
  - `Battle-tested`: there're plenty of examples of companies running it in production;
  - `Well-looked-after`: Big companies such as Redhat and Google have heavily invested in the future of Kubernetes by creating managed services, contributing to upstream development and offering training and consulting.

  ### 5.2. Creating a local Kubernetes cluster

  Although there are several ways to create a Kubernetes cluster, here we will use [Minikube](https://minikube.sigs.k8s.io/docs/start/) that runs a single-node Kubernetes cluster on your personal computer (including Windows, macOS and Linux PCs). So that you can try out Kubernetes, or for daily development work.

  1. Install the **Minikube**

  - Create a folder first where you would like to allocate it, e.g. `C:\Program Files\Minikube`
  - Download it in that folder: `curl -Lo minikube.exe https://github.com/kubernetes/minikube/releases/latest/download/minikube-windows-amd64.exe`
  - Add the path to the variables (`C:\Program Files\Minikube\`).

  2. Start your cluster: `$ minikube start` (NOTE: It could take a few minutes)

  3. Minikube can download the appropriate version of **kubectl** with: `$ minikube kubectl -- get po -A`.
     - `kubectl` is a Kubernetes command-line tool that allows you to run commands against Kubernetes clusters. You can use `kubectl` to deploy applications, inspect and manage cluster resources, and view logs.
     - To access your new cluster: `$ kubectl get po -A` or `$ kubectl cluster-info`

  **IMPORTANT**: For additional insight into your cluster state, Minikube bundles the `Kubernetes Dashboard`, allowing you to get easily acclimated to your new environment. `$ minikube dashboard`

  ### 5.3. Kubernetes resources

  Kubernetes has a declarative interface. In other words, you describe how you want the deployment of your application to look like, and Kubernetes figures out the necessary steps to reach this state. The way/language that you use to communicate with Kubernetes consists of so-called **Kubernetes resources**.

  - There are many different Kubernetes resources, each is responsible for a specific aspect of your application ([API reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.20/)).
  - Kubernetes resources are defined in YAML files and submitted to the cluster through the Kubernetes HTTP API. In practice, you do all these interactions with kubectl - your primary client for the Kubernetes API.

  ### 5.4. Defining a Deployment

  It's a best practice to group all resource definitions for an application in the same folder because this allows to submit them to the cluster with a single command. So, you should create a folder named `kube` in the application directory.

  You can find the specification of the Deployment resource in the API reference or you can use the command `$ kubetctl explain deployment` that retrieves the same information as the web-based API reference. To drill down to a specific field use: `$ kubectl explain deployment.spec.replicas`.

  **NOTES**:

  - You don't usually talk about `containers` in Kubernetes but `Pods`. A Pod is a wrapper around one or more containers.
  - The container specification also defines an imagePullPolicy of Always — the instruction forces the Docker image to be downloaded, even if it was already downloaded.

  ### 5.5. Defining a Service

  A Deployment defines how to run an app in the cluster, but it doesn't make it available to other apps. To expose your app, you need a Service. Summarizing, a **Service resource** makes Pods accessible to other Pods or users outside the cluster.
  It is a best-practice to save resource definitions that belong to the same application in the same YAML file. To do so, separate the Service and Deployment resources with three dashes.

  **NOTES**:

  - The label corresponds exactly to what you specified for the Pods in the Deployment resource: `knote`.
  - In this case, the Service listens for requests on port `80` and forwards them to port `3000` of the target Pods. And the type is `LoadBalancer`, which makes the exposed Pods accessible from outside the cluster.
  - The default Service type is `ClusterIP`, which makes the exposed Pods only accessible from within the cluster.
  - Beyond exposing your Pods, a Service also ensures continuous availability for your app. If one of the Pod crashes and is restarted, the Service makes sure not to route traffic to this container until it is ready again. Also, when the Pod is restarted, and a new IP address is assigned, the Service automatically handles the update too.
  - Furthermore, if you decide to scale your Deployment to 2, 3, 4, or 100 replicas, the Service keeps track of all of these Pods.

  ### 5.6. Defining the database tier

  If the MongoDB Pod is deleted or moved to another node, the storage must **persist**.

  - [PersistentVolumeClaim](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.20/#persistentvolumeclaim-v1-core)
  - The description of your database component should consist of three resource definitions:
    - PersistentVolumeClaim
    - Service
    - Deployment

  **NOTES**:

  - If a Service does not have a type field, Kubernetes assigns it the default type `ClusterIP`. This is fine because the only entity that has to access the MongoDB Pod is your app.
  - The `volumes` field defines a storage volume named storage, which references the `PersistentVolumeClaim`. The `volumeMount` field mounts the referenced volume at the specified path in the container, which in this case is `/data/db` (where MongoDB saves its data).
  - Pods within a cluster can talk to each other through the names of the Services exposing them.
  - Kubernetes has an internal DNS system that keeps track of domain names and IP addresses. Similarly to how Docker provides DNS resolution for containers, Kubernetes provides DNS resolution for Services.

  ### 5.7. Deploying the application

  **IMPORTANT**: Make sure that your Minikube cluster is running. `$ minikube status`

  Time for submitting your resource definitions to Kubernetes: `$ kubectl apply -f kube` where the `-f` flag accepts either a single filename or a directory. In the latter case, all YAML files in the directory are submitted.
  You can watch your Pods coming alive with: `$ kubectl get pods --watch`. You should see two Pods transitioning from Pending to `ContainerCreating` to `Running`. **As soon as both Pods are in the Running state, your application is ready.**

  In Minikube, a Service can be accessed with the following command: `$ minikube service knote --url`

  **IMPORTANT**: Because you are using a Docker driver on windows, the terminal needs to be open to run it!! So you will also need another window for mongo: `$ minikube service mongo --url`

  When you're done testing the app, you can remove it from the cluster with the following command: `$ kubectl delete -f kube`
