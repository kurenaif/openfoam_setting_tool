window.jQuery = window.$ = require('jquery');


require('jstree')
require('split-pane')
require('left_pane')

var fs = require("fs")
var path = require("path")

function get_json(d) {
    var dir_queue = [d]
    var output = []

    while (dir_queue.length > 0) {
        p = dir_queue[0];
        dir_queue.shift();
        files = fs.readdirSync(p);

        for (let i = 0; i < files.length; i++) {
            f = files[i];
            var fp = path.join(p, f); // to full-path
            if (fs.statSync(fp).isDirectory()) {
                dir_queue.push(fp);
                let path_array = fp.split("/");
                if (path_array.length === 1) {
                    let file = fp;
                    output.push({
                        "id": fp,
                        "type": "folder",
                        "parent": "#",
                        "text": file
                    })
                }
                else {
                    let file = path_array[path_array.length - 1];
                    let parent = fp.slice(0, -file.length - 1);
                    output.push({
                        "id": fp,
                        "type": "folder",
                        "parent": parent,
                        "text": file
                    })
                }
            } else {
                let path_array = fp.split("/");
                if (path_array.length === 1) {
                    let file = fp;
                    output.push({
                        "id": fp,
                        "type": "file",
                        "parent": "#",
                        "text": file
                    })
                }
                else {
                    let file = path_array[path_array.length - 1];
                    let parent = fp.slice(0, -file.length - 1);
                    output.push({
                        "id": fp,
                        "type": "file",
                        "parent": parent,
                        "text": file
                    })
                }
            }
        }
    }
    return output;
}

$(function () {
    $('#tree').jstree({
        'core': {
            "check_callback": true,
            "themes": { "name": 'proton' },
            'data': get_json(".")
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

console.log(get_json("."));