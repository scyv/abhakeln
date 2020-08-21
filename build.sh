#!/bin/bash

export JAVA_HOME=/Library/Java/JavaVirtualMachines/adoptopenjdk-8.jdk/Contents/Home/

meteor build ../abhakeln_build --server https://www.abhakeln.de --architecture os.linux.x86_64
cp ../abhakeln_build/abhakeln-meteor.tar.gz ~/Nextcloud/scytec-deploy/abhakeln/
