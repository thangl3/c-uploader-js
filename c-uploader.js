/*!
 * Chunked uploader javascript library v0.0.2
 *
 * Author: Thang Le
 * Date: 2018-08-27T16:50Z
 * Last Updated: 2018-08-30T21:00Z
 */
(function(global, factory) {
    "use strict";

    class cUploader
    {
        constructor(settings)
        {
            this.version = '0.0.1';
            this.xhr = new XMLHttpRequest();
            this.totalXhr = 0;
            this.numberOfSentXhr = 0;
            this.numberOfRetrySendXhr = 0;
            this.file = null;

            this.queueFile = [];
            this.queueSend = [];
            this.uploadLock = false;

            this.settings = {
                parameters : {
                    identifier : 'identifier',
                    fileName : 'filename',
                    fileType : 'fileType',
                    chunkedNumber : 'chunkedNumber',
                    numberChunkedOfFile : 'numberChunkedOfFile',
                    chunkedSize : 'chunkedSize',
                    totalFileSize : 'totalSize',
                    blobChunked : 'blod'
                },
                target: '/',
                method: 'POST',
                async: true,
                user: null,
                password: null,
                chunkSize: 90000,
                withCredentials: false,
                timeDelayEachRequest: 1000,
                indentifier : null,
                debug : false
            };

            this.listeners = {
                onload : null,
                onfinished : null,
                onprogress : null,
                onerror: null
            };

            this.addSettings(settings);
        }

        addSettings(settings)
        {
            this.settings = Object.assign(this.settings, settings);
        }

        hasSetting(key)
        {
            if (this.settings[key] !== undefined) {
                return true;
            }

            return false;
        }

        getSettings()
        {
            return this.settings;
        }

        getSetting(key)
        {
            if (this.hasSetting(key)) {
                return this.settings[key]
            }

            return null;
        }

        setSetting(key, value)
        {
            if (this.hasSetting(key)) {
                this.settings[key] = value;
            }
        }

        getParameterSetting(key)
        {
            let paramSettings = this.getSetting('parameters');

            if (paramSettings[key] !== undefined) {
                return paramSettings[key];
            }

            return null;
        }

        addEventListener(event, callback)
        {
            if (this.listeners[event] !== undefined) {
                this.listeners[event] = callback;
            }
        }

        callEventListener(event, argCallback = null)
        {
            if (this.listeners[event] !== undefined && this.listeners[event] !== null) {
                let listener = this.listeners[event];
                listener(argCallback);
            }
        }

        uploadFileById(documentId) {
            let file = document.querySelector(documentId).files[0];
            this.addFile(file);
        }

        addFile(file)
        {
            if (file) {
                this.file = file;
            } else {
                throw new Error('File upload not good!');
            }
        }

        generateUniqueIdentifier() {
            let callable = this.getSetting('indentifier');

            if (typeof callable === "function") {
                return callable();
            }

            return Math.random().toString(36).substring(2, 9);
        }

        createXhrData({fileName, indentifier, fileType, chunkedNumber, numberChunkedOfFile, chunkedSize, totalFileSize, blobChunked})
        {
            let formData = new FormData();

            formData.append(this.getParameterSetting('identifier'), indentifier);
            formData.append(this.getParameterSetting('fileName'), fileName);
            formData.append(this.getParameterSetting('fileType'), fileType);
            formData.append(this.getParameterSetting('chunkedSize'), chunkedSize);
            formData.append(this.getParameterSetting('chunkedNumber'), chunkedNumber);
            formData.append(this.getParameterSetting('numberChunkedOfFile'), numberChunkedOfFile);
            formData.append(this.getParameterSetting('totalFileSize'), totalFileSize);
            formData.append(this.getParameterSetting('blobChunked'), blobChunked, fileName);
            
            return formData;
        }

        /**
         * Deprecated method
         */
        process()
        {
            if (this.file === null || this.file === undefined) {
                return false;
            }

            let indentifier = this.generateUniqueIdentifier();
            let chunkedNumber = 1;
            let numberChunkedOfFile = 0;
            let chunkedSize = this.getSetting('chunkSize');
            let blobChunked = null;

            let first = 0;
            let last = chunkedSize;

            let formData = null;
            
            let fileName = this.file.name;
            let fileType = this.file.type;
            let totalFileSize = this.file.size;
            let that = this;
            let debug = this.getSetting('debug');

            // convert to Blob
            let fileBlob = this.file['slice'](first, totalFileSize, fileType);

            let totalLengthConvert = fileBlob.size;

            numberChunkedOfFile = Math.ceil(totalLengthConvert / chunkedSize);
            this.totalXhr = numberChunkedOfFile;

            if (debug) {
                console.log('============= FILE INFO =============');
                console.log('Blob', fileBlob);
                console.log('File name', fileName);
                console.log('File type', fileType);
                console.log('File size', totalFileSize);
                console.log('Total length convert', totalLengthConvert);
                console.log('Total chunked', numberChunkedOfFile);
                console.log('Each chunked size', chunkedSize);
                console.log('=====================================');
            }

            while(true) {
                if ( Number.isNaN(totalLengthConvert) || Number.isNaN(chunkedSize) ||
                        Number.isNaN(numberChunkedOfFile)) break;

                if (totalLengthConvert <= chunkedSize) {
                    blobChunked = fileBlob;

                    debug && console.log('Raw data send', {
                                fileName,
                                indentifier,
                                fileType,
                                chunkedNumber,
                                numberChunkedOfFile,
                                chunkedSize,
                                totalFileSize,
                                blobChunked
                            });

                    that.send({
                        fileName,
                        fileType,
                        indentifier,
                        chunkedNumber,
                        numberChunkedOfFile,
                        chunkedSize,
                        totalFileSize,
                        blobChunked
                    });

                    break;
                } else {
                    if (debug) {
                        console.log(`============ ${chunkedNumber} ============`);
                        console.log('first before', first);
                        console.log('last before', last);
                    }
                    
                    if (last >= totalLengthConvert) {
                        last = totalLengthConvert;
                        debug && console.log('final last will be upload', last);
                    }

                    blobChunked = fileBlob.slice(first, last);

                    debug && console.log('Raw data send', {
                                fileName,
                                indentifier,
                                fileType,
                                chunkedNumber,
                                numberChunkedOfFile,
                                chunkedSize,
                                totalFileSize,
                                blobChunked
                            });

                    that.send({
                        fileName,
                        fileType,
                        indentifier,
                        chunkedNumber,
                        numberChunkedOfFile,
                        chunkedSize,
                        totalFileSize,
                        blobChunked
                    });

                    if (last >= totalLengthConvert) {
                        break;
                    }

                    first = last;
                    last = last + chunkedSize;
                    chunkedNumber = chunkedNumber + 1;

                    if (debug) {
                        console.log('first after', first);
                        console.log('last after', last);
                    }
                }
            }

            this.callEventListener('onload');
        }

        /**
         * Deprecated method
         */
        send(data)
        {
            let timeDelayDefault = +this.getSetting('timeDelayDefault');
            let timeDelayEachRequest = +this.getSetting('timeDelayEachRequest');
            let delayAfterRequestNumber = +this.getSetting('delayAfterRequestNumber');
            let timeDelayAfterRequestNumber = +this.getSetting('timeDelayAfterRequestNumber');

            let that = this;
            let debug = this.getSetting('debug');
            that.xhr.withCredentials = that.getSetting('withCredentials');

            setTimeout( () => {
                let formData = that.createXhrData(data);

                that.xhr.open(
                    that.getSetting('method'),
                    that.getSetting('target'),
                    that.getSetting('async'),
                    that.getSetting('user'),
                    that.getSetting('password')
                );
                
                // Listener
                that.xhr.onload  = function() {//Call a function when the state changes.
                    if (that.xhr.status === 200) {
                        that.numberOfSentXhr++;

                        if ( that.numberOfSentXhr === that.totalXhr ) {
                            that.callEventListener('onfinished', that.xhr.responseText);
                            that.rollbackProperties();
                            debug && console.log('Finished with response', that.xhr.responseText);
                        }
                    } else if (that.xhr.status === 202) {
                        that.callEventListener('onprogress');
                    } else if (that.xhr.status === 500) {
                        that.callEventListener('onerror', that.xhr.responseText);
                        that.rollbackProperties();
                    } else {
                        if (that.numberOfRetrySendXhr < 10) {
                            that.numberOfRetrySendXhr++;
                            debug && console.log('retry', data);
                            that.send(data);
                        } else {
                            that.callEventListener('onerror', data);
                            that.rollbackProperties();
                        }
                    }
                }

                that.xhr.addEventListener("error", function(data) {
                    if (that.numberOfRetrySendXhr < 10) {
                        that.numberOfRetrySendXhr++;
                        debug && console.log('retry', data);
                        that.send(data);
                    } else {
                        that.callEventListener('onerror', data);
                        that.rollbackProperties();
                    }
                });

                // send data
                that.xhr.send(formData);
            }, timeDelayDefault);

            if ((that.chunkedNumber % delayAfterRequestNumber) == 0) {
                that.setSetting('timeDelayDefault', timeDelayDefault + timeDelayAfterRequestNumber);
            } else {
                that.setSetting('timeDelayDefault', timeDelayDefault + timeDelayEachRequest);
            }
        }

        addToQueueSend(data) {
            this.queueSend.push(data);
        }

        upload()
        {
            if (this.file === null || this.file === undefined) {
                return false;
            }

            let indentifier = this.generateUniqueIdentifier();
            let chunkedNumber = 1;
            let numberChunkedOfFile = 0;
            let chunkedSize = this.getSetting('chunkSize');
            let blobChunked = null;

            let first = 0;
            let last = chunkedSize;
            
            let fileName = this.file.name;
            let fileType = this.file.type;
            let totalFileSize = this.file.size;
            let that = this;
            let debug = this.getSetting('debug');

            // convert to Blob
            let fileBlob = this.file['slice'](first, totalFileSize, fileType);

            let totalLengthConvert = fileBlob.size;

            numberChunkedOfFile = Math.ceil(totalLengthConvert / chunkedSize);
            this.totalXhr = numberChunkedOfFile;

            if (debug) {
                console.log('============= FILE INFO =============');
                console.log('Blob', fileBlob);
                console.log('File name', fileName);
                console.log('File type', fileType);
                console.log('File size', totalFileSize);
                console.log('Total length convert', totalLengthConvert);
                console.log('Total chunked', numberChunkedOfFile);
                console.log('Each chunked size', chunkedSize);
                console.log('=====================================');
            }

            while(true) {
                if ( Number.isNaN(totalLengthConvert) || Number.isNaN(chunkedSize) ||
                        Number.isNaN(numberChunkedOfFile)) break;

                if (totalLengthConvert <= chunkedSize) {
                    blobChunked = fileBlob;

                    this.addToQueueSend({
                        fileName,
                        fileType,
                        indentifier,
                        chunkedNumber,
                        numberChunkedOfFile,
                        chunkedSize,
                        totalFileSize,
                        blobChunked
                    });

                    break;
                } else {
                    if (debug) {
                        console.log(`============ ${chunkedNumber} ============`);
                        console.log('first before', first);
                        console.log('last before', last);
                    }
                    
                    if (last >= totalLengthConvert) {
                        last = totalLengthConvert;
                        debug && console.log('final last will be upload', last);
                    }

                    blobChunked = fileBlob.slice(first, last);

                    this.addToQueueSend({
                        fileName,
                        fileType,
                        indentifier,
                        chunkedNumber,
                        numberChunkedOfFile,
                        chunkedSize,
                        totalFileSize,
                        blobChunked
                    });

                    if (last >= totalLengthConvert) {
                        break;
                    }

                    first = last;
                    last = last + chunkedSize;
                    chunkedNumber = chunkedNumber + 1;

                    if (debug) {
                        console.log('first after', first);
                        console.log('last after', last);
                    }
                }
            }

            this.callEventListener('onload');
            this.sendQueue();
        }

        sendQueue(index = 0)
        {
            let that = this;
            let debug = this.getSetting('debug');

            let formData = that.createXhrData(this.queueSend[index]);

            this.xhr.open(
                this.getSetting('method'),
                this.getSetting('target'),
                this.getSetting('async'),
                this.getSetting('user'),
                this.getSetting('password')
            );
            
            // Listener
            this.xhr.onreadystatechange = function() {//Call a function when the state changes.
                if (that.xhr.readyState === 4) {
                    if (that.xhr.status === 200) {
                        that.numberOfSentXhr++;
                        if ( that.numberOfSentXhr === that.totalXhr ) {
                            that.callEventListener('onfinished', that.xhr.responseText);
                            that.rollbackProperties();
                            debug && console.log('Finished with response', that.xhr.responseText);
                        }
                    } else if (that.xhr.status === 202) {
                        that.callEventListener('onprogress');
                        that.numberOfSentXhr++;
                        that.sendQueue(++index);
                    } else {
                        if (that.numberOfRetrySendXhr < 10) {
                            that.numberOfRetrySendXhr++;
                            debug && console.log('retry', index);
                            that.sendQueue(index);
                        } else {
                            that.callEventListener('onerror', event);
                            that.rollbackProperties();
                        }
                    }
                } else if (that.xhr.readyState < 2) {
                    that.xhr.withCredentials = that.getSetting('withCredentials');
                }
            }

            let timeDelayEachRequest = +this.getSetting('timeDelayEachRequest');

            setTimeout(() => {
                that.xhr.send(formData);
            }, timeDelayEachRequest);
        }

        rollbackProperties() {
            this.totalXhr = 0;
            this.numberOfSentXhr = 0;
            this.numberOfRetrySendXhr = 0;
            this.file = null;
            this.queueSend.length = 0;
        }
    }

    window.cUploader = cUploader;
})();
