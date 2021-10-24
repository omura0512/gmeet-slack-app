# Clasp
SRC_DIR=./src
WORK_DIR=/workdir
VOLUME=gas

clasp-init:
	touch .clasprc.json
	docker-compose run --rm -w ${WORK_DIR} ${VOLUME} clasp login --no-localhost

clasp-clone:
	docker-compose run --rm -w ${WORK_DIR} ${VOLUME} clasp clone --rootDir ${SRC_DIR}

clasp-before:
	docker-compose run --rm -w ${WORK_DIR} ${VOLUME} cp -p ${SRC_DIR}/.clasp.json ./.clasp.json

clasp-push: clasp-before
	docker-compose run --rm -w ${WORK_DIR} ${VOLUME} clasp push

clasp-pull: clasp-before
	docker-compose run --rm -w ${WORK_DIR} ${VOLUME} clasp pull 

.PHONY: clasp
