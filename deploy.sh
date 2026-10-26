#!/bin/bash
set -e
git pull origin main
TAG=$(git rev-parse --short HEAD)
eval $(minikube docker-env)
docker build -t modern-express:$TAG .
eval $(minikube docker-env -u)
helm upgrade --install modern ~/paas-app-chart -f ~/paas-app-chart/values-modern.yaml \
  --set image=modern-express:$TAG -n tenant-beta
kubectl rollout status deploy/modern-express -n tenant-beta
echo "Desplegado: modern-express:$TAG"
