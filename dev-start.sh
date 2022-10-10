#!/bin/sh
sh -c 'echo $$ > intern.pid; exec node index.js'
