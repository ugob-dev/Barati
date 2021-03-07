'use strict'

const { parentPort,workerData  } = require('worker_threads')

setTimeout(function() {
    const message = ' Fini '
    parentPort.postMessage({ message: message , isFinish : true})

}, workerData.cooking)