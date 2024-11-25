#!/bin/bash

LOG_FILE="build_docker_images.log"

echo "Building Docker images..." > $LOG_FILE

declare -A DOCKERFILES=(
    ["docker/Dockerfile-python"]="code-executor-python"
    ["docker/Dockerfile-c"]="code-executor-c"
    ["docker/Dockerfile-java"]="code-executor-java"
    ["docker/Dockerfile-cpp"]="code-executor-cpp"
    ["docker/Dockerfile-go"]="code-executor-go"
    ["docker/Dockerfile-haskell"]="code-executor-haskell"
    ["docker/Dockerfile-javascript"]="code-executor-javascript"
    ["docker/Dockerfile-kotlin"]="code-executor-kotlin"
    ["docker/Dockerfile-perl"]="code-executor-perl"
    ["docker/Dockerfile-php"]="code-executor-php"
    ["docker/Dockerfile-ruby"]="code-executor-ruby"
    ["docker/Dockerfile-rust"]="code-executor-rust"
    ["docker/Dockerfile-shell"]="code-executor-shell"
    ["docker/Dockerfile-swift"]="code-executor-swift"
    ["docker/Dockerfile-typescript"]="code-executor-typescript"
)

for DOCKERFILE in "${!DOCKERFILES[@]}"; do
    IMAGE_NAME=${DOCKERFILES[$DOCKERFILE]}
    echo "Building $IMAGE_NAME from $DOCKERFILE..." | tee -a $LOG_FILE
    if docker build -f $DOCKERFILE -t $IMAGE_NAME . >> $LOG_FILE 2>&1; then
        echo "$IMAGE_NAME built successfully." | tee -a $LOG_FILE
    else
        echo "Error building $IMAGE_NAME. Check the log file for details." | tee -a $LOG_FILE
        exit 1
    fi
done

echo "All Docker images built successfully!" | tee -a $LOG_FILE
