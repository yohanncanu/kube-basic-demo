# kube basic demo



## kube-01

learn basics about network and service exposition

```bash 
cd kube-01
## deploy some pods
cat << EOF > foo-pod.yml
kind: Pod
apiVersion: v1
metadata:
  name: foo-app
  labels:
    app: foo
spec:
  containers:
  - name: foo-app
    image: hashicorp/http-echo:0.2.3
    args:
    - "-text=foo"
EOF

cat << EOF > bar-pod.yml
kind: Pod
apiVersion: v1
metadata:
  name: bar-app
  labels:
    app: bar
spec:
  containers:
  - name: bar-app
    image: hashicorp/http-echo:0.2.3
    args:
    - "-text=bar"
EOF

kubectl apply -f .
# test forwarding port to 30080
kubectl port-forward pod/foo-app :5678

# create a service to go with it
cat << EOF > foo-service.yml
kind: Service
apiVersion: v1
metadata:
  name: foo-service
spec:
  selector:
    app: foo
  ports:
  # Default port used by the image
  - port: 5678
EOF

# bar service
cat << EOF > bar-service.yml
kind: Service
apiVersion: v1
metadata:
  name: bar-service
spec:
  selector:
    app: bar
  ports:
  # Default port used by the image
  - port: 5678
EOF

kubectl apply -f .

# Ingress
cat << EOF > foo-bar-ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
spec:
  rules:
  - http:
      paths:
      - pathType: Prefix
        path: "/foo"
        backend:
          service:
            name: foo-service
            port:
              number: 5678
      - pathType: Prefix
        path: "/bar"
        backend:
          service:
            name: bar-service
            port:
              number: 5678
EOF
# install ingress controller
# test http:/kubedev.local/
```

## kube-02

```bash 
# use a dockerfile to 
cd kube-02
cat << EOF > Dockerfile
FROM php:5-apache
COPY index.php /var/www/html/index.php
RUN chmod a+rx index.php
EOF

cat << EOF > index.php
<?php
  $x = 0.0001;
  for ($i = 0; $i <= 1000000; $i++) {
    $x += sqrt($x);
  }
  echo "OK!";
?>
EOF

docker build -t myapache:1.0 .
docker tag myapache:1.0 k3d-registry.localhost:5000/myapache:1.0
docker push k3d-registry.localhost:5000/myapache:1.0
#if registry is not working
k3d image import k3d-registry.localhost:5000/myapache:1.0 -c local-dev

k create deployment php-apache --image=k3d-registry.localhost:5000/myapache:1.0 --dry-run=client -o yaml > myapache-deploy.yml
# add ports --> 80 + resource limits + strategy
k apply -f .



kubectl expose rc nginx --port=80 --target-port=8000

# check horizontal scaling
# https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/

# create a deployment
k create deployment php-apache --image=k3d-registry.localhost:5000/php-apache:1.0 --dry-run=client -o yaml > php-apache-deploy.yml
kubectl set image deployment/php-apache php-apache=nginx:1.16.1

kubectl set image deployment/php-apache php-apache=nginx:1.19.18
k rollout status deployment/php-apache

# debug a pod
POD=chuck-5f59c4b6cf-vvxm9
kubectl debug $POD -it --image=weibeld/ubuntu-networking --share-processes --copy-to=debug
```

## kube-03

```bash 
cat << EOF > Dockerfile
FROM debian:10-slim
ENV tmp_dir /tmp

RUN apt-get update \
  && apt-get install -y curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get install -y nodejs

RUN npm install -g json-server

RUN echo '{"cars":[{"id":1,"brand":"opel","model":"corsa"},{"id":2,"brand":"ford","model":"fiesta"}]}' > /tmp/test.json
ENTRYPOINT ["json-server", "--port", "8080", "--host", "0.0.0.0"]
CMD ["/tmp/test.json"]
EOF
docker build -t jsonserver:1.0 .
docker run --rm  -it --name jsonserver-container -p 8082:8080 -e "file=https://raw.githubusercontent.com/yohanncanu/fake-data/main/db.json" jsonserver:1.0
docker run -d --name jsonserver-container -p 8080:8080 -e "file=https://raw.githubusercontent.com/yohanncanu/fake-data/main/db.json" jsonserver:1.0

mkdir config
cat << EOF > config/front.env
API_METEO_URL=meteo.demo3.example.com
API_BLOG_URL=blog.demo3.example.com
1.0.7
1.3.0
EOF
kubectl create configmap ,config-front --from-literal=API_METEO_URL=meteo.demo3.example.com --from-literal=API_BLOG_URL=blog.demo3.example.com
kubectl create configmap my-config --from-file=config --dry-run=client -o yaml

```



## kube-04

```bash 
cd kube-04

cat << EOF > blog-deploy.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: blog
  name: blog
spec:
  replicas: 1
  selector:
    matchLabels:
      app: blog
  template:
    metadata:
      labels:
        app: blog
    spec:
      containers:
      - name: blog
        image: gcr.io/winzana-workshop/knative-kong/blog:v1.0.6
        command: ['node', './dist/apps/api/blog/main.js']
        env:
        - name: port
          value: '3333'
        - name: NODE_ENV
          value: 'production'
        ports:
        - containerPort: 3333
          name: web
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: blog
  name: blog
spec:
  ports:
  - port: 3333
  selector:
    app: blog
EOF

cat << EOF > blog-ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-blog
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - www.demo3.example.com
    secretName: demo3.example.com
  rules:
  - host: blog.demo3.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog
            port:
              number: 3333
EOF

cat << EOF > front-deploy.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: front
  name: front
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: front
  template:
    metadata:
      labels:
        app: front
    spec:
      containers:
      - name: front
        image: gcr.io/winzana-workshop/knative-kong/front:v1.0.5
        ports:
        - containerPort: 8080
          name: web
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: front
  name: front
spec:
  ports:
  - port: 8080
  selector:
    app: front
EOF

cat << EOF > front-ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-front
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - www.demo3.example.com
    secretName: demo3.example.com
  rules:
  - host: www.demo3.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: front
            port:
              number: 8080
EOF

cat << EOF > meteo-deploy.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: meteo
  name: meteo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: meteo
  template:
    metadata:
      labels:
        app: meteo
    spec:
      containers:
      - name: meteo
        image: gcr.io/winzana-workshop/knative-kong/meteo:v1.0.6
        command: ['node', './dist/apps/api/meteo/main.js']
        env:
        - name: port
          value: '3333'
        - name: NODE_ENV
          value: 'production'
        ports:
        - containerPort: 3333
          name: web
          protocol: TCP
------
apiVersion: v1
kind: Service
metadata:
  labels:
    app: meteo
  name: meteo
spec:
  ports:
  - port: 3333
  selector:
    app: meteo
EOF

cat << EOF > meteo-ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-meteo
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - www.demo3.example.com
    secretName: demo3.example.com
  rules:
  - host: meteo.demo3.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: meteo
            port:
              number: 3333
 EOF
 
 k apply -f .
 https://www.demo3.example.com
```

