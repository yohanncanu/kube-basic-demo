# kube basic demo



## kube-01

```bash 
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
# test forwarding port
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
```

## kube-02

```bash 
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


k create deployment php-apache --image=k3d-registry.localhost:5000/myapache:1.0 --dry-run=client -o yaml > myapache-deploy.yml
# add ports --> 80 + resource limits + strategy
k apply -f .

# test dns
cat << EOF > pod.yml
apiVersion: v1
kind: Pod
metadata:
    name: busybox
spec:
    containers:
    - image: busybox
      command:
          - sleep
          - "3600"
      imagePullPolicy: IfNotPresent
      name: busybox
    restartPolicy: Always
EOF
k create -f pod.yml
kubectl exec -it busybox -- ping -c1 k3d-registry.localhost
kubectl run -it --rm --restart=Never busybox --image=busybox:1.28 -- nslookup kubernetes.default
kubectl run -it --rm --restart=Never busybox --image=busybox:1.28 -- nslookup www.google.com
# https://rancher.com/docs/rancher/v2.5/en/troubleshooting/dns/

kubectl expose rc nginx --port=80 --target-port=8000


kubectl autoscale deployment/php-apache --min=10 --max=15 --cpu-percent=80



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


```

