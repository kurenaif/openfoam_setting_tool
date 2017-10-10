window.jQuery = window.$ = require('jquery');

require('jstree')
require('split-pane')

var fs = require("fs")
var path = require("path")
var dir = '.'; //引数が無いときはカレントディレクトリを対象とする

var walk = function (p, fileCallback, errCallback) {

    fs.readdir(p, function (err, files) {
        if (err) {
            errCallback(err);
            return;
        }

        files.forEach(function (f) {
            var fp = path.join(p, f); // to full-path
            if (fs.statSync(fp).isDirectory()) {
                fileCallback(fp, "folder"); // ディレクトリでもコールバックで通知 
                walk(fp, fileCallback); // ディレクトリなら再帰
            } else {
                fileCallback(fp, "file"); // ファイルならコールバックで通知
            }
        });
    });
};


mytest = [
    { "id": "a", "type": "folder", "text": "a", "parent": "#" },
    { "id": "a/test", "parent": "a", "text": "test", "type": "file" }
]

$(function () {
    // 使う方
    let jstree_data_array = [];
    walk(dir, function (path, type) {
        let path_array = path.split("/");
        if (path[0] !== "a") return;
        if (path_array.length === 1) {
            let file = path;
            jstree_data_array.push({
                "id": path,
                "type": type,
                "parent": "#",
                "text": file
            })
        }
        else {
            let file = path_array[path_array.length - 1];
            let parent = path.slice(0, -file.length - 1);
            jstree_data_array.push({
                "id": path,
                "type": type,
                "parent": parent,
                "text": file
            })
        }
    }, function (err) {
        // alert("Receive err:" + err); // エラー受信
    });

    $('#tree').jstree({
        'core': {
            "check_callback": true,
            "themes": { "name": 'proton' },
            'data':
            //mytest
            jstree_data_array
            // [
            //     { "id": "ajson1", "type":"folder", "parent": "#", "text": "Simple root node" },
            //     { "id": ".ajson2", "type": "folder", "parent": "#", "text": "Root node 2" },
            //     { "id": ".ajson2/ajson3", "type": "file", "parent": ".ajson2", "text": "Child 1" },
            //     { "id": ".ajson2/ajson4", "type": "file", "parent": ".ajson2", "text": "Child 2" },
            //     { "id": "a", "type": "folder", "text": "a", "parent": "#"},
            //     {"id": "a/test", "parent": "a", "text":"test", "type": "file"}
            // ]
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

