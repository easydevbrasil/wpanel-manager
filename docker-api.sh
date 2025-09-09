docker run -d \
  --name dind \
  --privileged \
  -p 127.0.0.1:62375:62375 \
  docker:dind \
  dockerd -H tcp://0.0.0.0:62375 -H unix:///var/run/docker.sock
