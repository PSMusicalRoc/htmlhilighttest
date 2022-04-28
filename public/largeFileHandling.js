/**
 * Reads data from a File object in parts so that
 * nothing is lost, and each time the file is read from,
 * call `callback`.
 * 
 * @param {File} file The file to read from.
 * @param {function(String)} callback The function to call every time you read a section of the file
 */
function readInFile(file, callback) {
    let done = false;
    let CHUNK_SIZE = 1024 * 10; // 1KB
    var offset = 0;
    var fr = new FileReader();
    fr.onload = function() {
        var contents = encodeURIComponent(fr.result.toString());
        /*.replaceAll("&", "%26")
        .replaceAll("+", "%2b");
        .replaceAll("$", "%24")
        .replaceAll(",", "%2c")
        .replaceAll("/", "%2f")
        .replaceAll(":", "%3a")
        .replaceAll(";", "%3b")
        .replaceAll("=", "%3d")
        .replaceAll("?", "%3f")
        .replaceAll("@", "%40");*/
        callback(contents);
        offset += CHUNK_SIZE;
        seek();
    };
    fr.onerror = function() {
        callback("");
    };
    seek();

    function seek() {
        if (done) {return;}
        if (offset >= file.size) {
            return;
            // var slice = file.slice(offset - CHUNK_SIZE, file.size);
            // done = true;
            // fr.readAsText(slice);
        }
        var slice = file.slice(offset, offset + CHUNK_SIZE);
        fr.readAsText(file);
    }
}