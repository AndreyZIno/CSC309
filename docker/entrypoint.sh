#!/bin/bash

LANGUAGE=$1
CODE_FILE=$2
INPUT_FILE=$3

if [ ! -f "$CODE_FILE" ]; then
  echo "Code file not found: $CODE_FILE"
  exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
  echo "Input file not found: $INPUT_FILE"
  INPUT_FILE="/dev/null" # Use empty input if no input file exists
fi

case $LANGUAGE in
  "python")
    python3 $CODE_FILE < $INPUT_FILE
    ;;
  "c")
    gcc $CODE_FILE -o program && ./program < $INPUT_FILE
    ;;
  "cpp")
    g++ $CODE_FILE -o program && ./program < $INPUT_FILE
    ;;
  "java")
    javac $CODE_FILE && java -cp /code Main < $INPUT_FILE
    ;;
  "javascript")
    node $CODE_FILE < $INPUT_FILE
    ;;
  "kotlin")
    /usr/local/bin/kotlinc/bin/kotlinc $CODE_FILE -include-runtime -d program.jar && java -jar program.jar < $INPUT_FILE
    ;;
  "ruby")
    ruby $CODE_FILE < $INPUT_FILE
    ;;
  "php")
    php $CODE_FILE < $INPUT_FILE
    ;;
  "perl")
    perl $CODE_FILE < $INPUT_FILE
    ;;
  "go")
    go run "$CODE_FILE" < "$INPUT_FILE" | awk 'NF'
    ;;
  "haskell")
    ghc -o program $CODE_FILE && ./program < $INPUT_FILE
    ;;
  "rust")
    rustc $CODE_FILE -o program && ./program < $INPUT_FILE
    ;;
  "typescript")
    tsc $CODE_FILE --outDir /code/dist --module commonjs --target es6 && \
    node /code/dist/code.js < $INPUT_FILE
    ;;
  "shell")
    /bin/bash $CODE_FILE < $INPUT_FILE
    ;;
  "swift")
    swift $CODE_FILE < $INPUT_FILE
    ;;
  *)
    echo "Unsupported language: $LANGUAGE"
    exit 1
    ;;
esac
