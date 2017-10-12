window.jQuery = window.$ = require('jquery');

require('jstree')
require('split-pane')

var fs = require("fs")
var path = require("path")

/** @description Get directory structure JSON for jstree
 * 
 * @param {string} rootDir root directory name
 * @return {json} directory structure JSON data
 */
var GetJson = (rootDir) => {
    // directory queue for BFS search
    let dirQueue = [rootDir]
    // response json data
    let resJSON = []

    while (dirQueue.length > 0) {
        p = dirQueue[0];
        dirQueue.shift();
        files = fs.readdirSync(p);

        for (let i = 0; i < files.length; i++) {
            f = files[i];
            let fp = path.join(p, f); // to full-path
            if (fs.statSync(fp).isDirectory()) {
                dirQueue.push(fp);
                let pathArray = fp.split("/");
                if (pathArray.length === 1) {
                    let file = fp;
                    resJSON.push({
                        "id": fp,
                        "type": "folder",
                        "parent": "#",
                        "text": file
                    })
                }
                else {
                    let file = pathArray[pathArray.length - 1];
                    let parent = fp.slice(0, -file.length - 1);
                    resJSON.push({
                        "id": fp,
                        "type": "folder",
                        "parent": parent,
                        "text": file
                    })
                }
            } else {
                let pathArray = fp.split("/");
                if (pathArray.length === 1) {
                    let file = fp;
                    resJSON.push({
                        "id": fp,
                        "type": "file",
                        "parent": "#",
                        "text": file
                    })
                }
                else {
                    let file = pathArray[pathArray.length - 1];
                    let parent = fp.slice(0, -file.length - 1);
                    resJSON.push({
                        "id": fp,
                        "type": "file",
                        "parent": parent,
                        "text": file
                    })
                }
            }
        }
    }
    return resJSON;
}

/** @description event handler for jstree select
 * 
 * @param {*} event event
 * @param {*} data selected data
 */
var event = (event, data) => {
    $("#right-content").html(data.node.id + ":" + data.node.type);
}

// jquery ready...
$(function () {
    $('#tree').on({
        'select_node.jstree': event
    })
    .jstree({
        'core': {
            "check_callback": true,
            "themes": { "name": 'proton' },
            'data': GetJson(".")
        },
        'types': {
            'folder': {
                'icon': "glyphicon glyphicon-folder-open"
            },
            'file': {
                'icon': "glyphicon glyphicon-file"
            }
        },
        "plugins": ["types"],
    });
    $('div.split-pane').splitPane();
});