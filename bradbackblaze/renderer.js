// Authentication
const axios = require('axios');

const accountID = '1';
const applicationKey = '1';
let credentials;
const encodedBase64 = btoa(accountID + ":" + applicationKey);

// Console
const consolearea = document.getElementById('consolemessage');

consolearea.value += "Authentication started...";
axios.post(
        `https://api.backblazeb2.com/b2api/v1/b2_authorize_account`, {}, {
            headers: {
                Authorization: 'Basic ' + encodedBase64
            }
        })
    .then(function (response) {
        let data = response.data
        credentials = {
            applicationKey: applicationKey,
            apiUrl: data.apiUrl,
            authorizationToken: data.authorizationToken,
            downloadUrl: data.downloadUrl,
            recommendedPartSize: data.recommendedPartSize
        }
        console.log(credentials);
        consolearea.value += "\nAuthentication Successful. You may now upload files.";
    })
    .catch(function (err) {
        console.log(err);
        consolearea.value += "\nError during Authentication! Restart program." + err;
});

// File Upload
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const bucketId = "ff89d5546fdab1f26d510e17";

// File tracking
let fileNumber = 1;
let totalNumberOfFiles;

const uploadFile = (filepath, fileName) => {
    let fileLocation = fs.readFileSync(filepath);
    consolearea.value += "\nStarting upload of file number " + fileNumber + ":" + fileName;
    axios.post(
            credentials.apiUrl + '/b2api/v1/b2_get_upload_url', {
                bucketId: bucketId
            }, {
                headers: {
                    Authorization: credentials.authorizationToken
                }
            })
        .then(function (response) {
            let uploadUrl = response.data.uploadUrl;
            let uploadAuthorizationToken = response.data.authorizationToken;

            let sha1 = crypto.createHash('sha1').update(fileLocation).digest("hex");

            axios.post(
                uploadUrl,
                fileLocation, {
                    headers: {
                        Authorization: uploadAuthorizationToken,
                        "X-Bz-File-Name": fileName,
                        "Content-Type": "b2/x-auto",
                        "X-Bz-Content-Sha1": sha1,
                        "X-Bz-Info-Author": "Brad"
                    }
                }
            ).then(function (response) {
                console.log(response); // successful response
                consolearea.value += "\nFile " + fileName + " has been uploaded.";
            }).catch(function (err) {
                console.log(err); // an error occurred
                consolearea.value += "\nError" + err;
            });
        })
        .catch(function (err) {
            console.log(err); // an error occurred
            consolearea.value += "\nError" + err;
        });
}

// Check for white space
const checkWhiteSpace = (string) => {
    return string.indexOf(' ') >= 0;
}

// Event Listeners 
document.getElementById('submit').addEventListener('click', () => {

    let filePath = document.getElementById('fileUploadChooser').files
    totalNumberOfFiles = filePath.length;

    if (totalNumberOfFiles == 0) {
        document.getElementById('errorFile').innerText = "No File Selected";
        return;
    } else {
        document.getElementById('errorFile').innerText = "";
    }

    // Check if BackBlaze Location is valid
    let bucketFolder = document.getElementById('bucketLocation').value;
    if (checkWhiteSpace(bucketFolder) || bucketFolder == '' || bucketFolder == undefined){
        document.getElementById('bucketLocationError').innerText = "Invalid location or missing location!";
        return;
    } else {
        document.getElementById('bucketLocationError').innerText = "";
    }

    // Start upload
    // This needs to be converted into await/async
    for (let i = 0; i < totalNumberOfFiles; i++){
         let filePathLocation = filePath[i].path;
         let newFileName = path.basename(filePathLocation);
         let finalNewFileName = bucketFolder + "/" + newFileName;
         finalNewFileName = finalNewFileName.replace(/ /g, "_");
         uploadFile(filePathLocation, finalNewFileName);
         fileNumber++;
    }
    
    // Reached End
    fileNumber = 1;
    consolearea.value += "\nUpload complete.";
});

// Remove Red alert
document.getElementById('fileUploadChooser').addEventListener("change" , () => {
    let filePath = document.getElementById('fileUploadChooser').files.length;

    if (filePath == 0) {
        document.getElementById('errorFile').innerText = "No File Selected";
    } else {
        document.getElementById('errorFile').innerText = "";
    }
});

document.getElementById('bucketLocationError').addEventListener('change', () => {
     let bucketFolder = document.getElementById('bucketLocation').value;
     if (checkWhiteSpace(bucketFolder) || bucketFolder == '' || bucketFolder == undefined) {
         document.getElementById('bucketLocationError').innerText = "Invalid location or missing location!";
         return;
     } else {
         document.getElementById('bucketLocationError').innerText = "";
     }
});
