#!/bin/bash

echo "# chat" >> README.md
git init
git add *
git commit -m "first commit"
git remote add origin git@github.com:dbjnbnrj/chat.git
git push -u origin master
