let compressedImageBlob;

document.addEventListener("DOMContentLoaded", function() {

    let imageToFilter = null;
    const filteredImage = document.querySelector("#filteredImage");

    // initializing the filter value
    const filterElement = document.getElementsByName("filterRadio");
    let filter;
    filterElement.forEach((f) => {
        if (f.checked) filter = f.value;
    });

    // applying the selected filter
    filterElement.forEach((f) => {
        f.onclick = () => {
            filter = f.value;
            filteredImage.src = draw_image_with_filter(imageToFilter, filter);
        };
    });

    const fileInput = document.querySelector("#upload");
    const imagesDiv = document.querySelector("#images");

    fileInput.addEventListener("change", async (e) => {

        const [file] = fileInput.files;

        // displaying the uploaded image
        imageToFilter = document.querySelector("#imageToFilter");
        imageToFilter.src = await fileToDataUri(file);

        // making the div containing the image visible
        imagesDiv.style.visibility = "visible";

        // applying the default filter
        imageToFilter.addEventListener("load", () => {
            filteredImage.src = draw_image_with_filter(imageToFilter, filter);
        });

        return false;
    });

    const compressButton = document.querySelector("#compressButton");
    console.log("compressButton", compressButton);
    const uploadButton = document.querySelector("#uploadButton");
    console.log("uploadButton", uploadButton);
    const uploadButtonProgress = document.querySelector("#uploadButtonProgress");
    console.log("uploadButtonProgress", uploadButtonProgress);

    compressButton.addEventListener("click", () => {
        // filteredImage.src = draw_image_with_filter(imageToFilter, filter);
        const imageToUpload = document.querySelector("#imageToUpload");
        compressImage(filteredImage, 0.5, 0.5, imageToUpload);
    });

    uploadButton.addEventListener("click", () => {

        const formdata = new FormData();
        console.log("compressedImageBlob", compressedImageBlob);
        // TODO: image name
        // TODO: no global
        formdata.append("img", compressedImageBlob, "blob22.jpg");

        fetch("http://127.0.0.1:8000/", {
        // fetch("http://127.0.0.1:8000/upload/", {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: formdata
        }).then((response) => {
            if (response.status === 200) {
                // retrieving the URL of the image
                // just uploaded to Imgur
                /*
                response.json().then((jsonResponse) => {
                    alert(`URL: ${jsonResponse.data?.link}`);
                });
                */
                alert("Upload completed succesfully!");
            } else {
                console.error(response);
            }
        });


    });

    uploadButtonProgress.addEventListener("click",  () => {

        // According to hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors
        // request can be preflighted (eg. first sends the OPTIONS header to the ressource)
        // Django should respond to this first request

        let progressBar = document.querySelector("progress");
        console.log("progressBar", progressBar);
        let form_data = new FormData();
        console.log("[progress] compressedImageBlob", compressedImageBlob);
        // TODO: image name
        // TODO: no global
        form_data.append("img", compressedImageBlob, "blob22.jpg");

        let xhr = new XMLHttpRequest();
        // xhr.open('POST', 'http://127.0.0.1:8000/upload/', true);
        xhr.open('POST', 'http://127.0.0.1:8000/', true);
        // xhr.setRequestHeader("Accept", "application/json");
        // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("HTTP_X_REQUESTED_WITH", "XMLHttpRequest");

        xhr.onload = function(e) {
            alert("Upload completed succesfully!");
        };
        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                progressBar.value = (e.loaded / e.total) * 100;
                progressBar.textContent = progressBar.value; // fallback for unsupported browsers
            }
        };

        console.log("Sending blob...");
        // xhr.send(compressedImageBlob);
        xhr.send(form_data);
    });

})

function fileToDataUri(field) {

    // (async) read uploaded image
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            resolve(reader.result);
        });
        reader.readAsDataURL(field);
    });
}

function draw_image_with_filter(imageToFilter, filter) {

    // draw image to canvas2D with/without filter
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const canvasWidth = imageToFilter.width;
    const canvasHeight = imageToFilter.height;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.drawImage(imageToFilter, 0, 0, canvasWidth, canvasHeight);

    const sourceImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
    const blankOutputImageData = context.createImageData(
        canvasWidth,
        canvasHeight
    );

    const outputImageData = applyFilter(
        sourceImageData,
        blankOutputImageData,
        filter
    );

    context.putImageData(outputImageData, 0, 0);

    return canvas.toDataURL();
}

function applyFilter(sourceImageData, outputImageData, filter) {

    // console.log("filter", filter);
    /*
    if (filter === "noFilter") {
        return sourceImageData;
    } else if (filter === "greyscale") {
        return apply_greyscale(sourceImageData);
    }
    */

    if (filter === "greyscale") {
        return apply_greyscale(sourceImageData);
    } else {
        // noFilter or unknown filter
        return sourceImageData;
    }
}

function apply_greyscale(sourceImageData) {

    // RGB to grey filter

    const src = sourceImageData.data;

    for (let i = 0; i < src.length; i += 4) {
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];
        src[i] = src[i+1] = src[i+2] = r;
    }

    return sourceImageData;
}

// compressImage

function compressImage(imgToCompress, resizingFactor, quality, dst) {

    // showing the compressed image
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const originalWidth = imgToCompress.width;
    const originalHeight = imgToCompress.height;

    const canvasWidth = originalWidth * resizingFactor;
    const canvasHeight = originalHeight * resizingFactor;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.drawImage(
        imgToCompress,
        0,
        0,
        originalWidth * resizingFactor,
        originalHeight * resizingFactor
    );

    // reducing the quality of the image
    canvas.toBlob(
        (blob) => {
            if (blob) {
                compressedImageBlob = blob;
                console.log("blob", blob);
                // compressedImage.src = URL.createObjectURL(compressedImageBlob);
                dst.src = URL.createObjectURL(blob);
                console.log("dst src", dst.src);
                // document.querySelector("#size").innerHTML = bytesToSize(blob.size);
                // return blob;
            }
        },
        "image/jpeg",
        quality
    );
}

// source: https://stackoverflow.com/a/18650828
/*
function bytesToSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes === 0) {
        return "0 Byte";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}
*/