window.jQuery = window.$ = require('jquery');

require('jstree')
require('split-pane')

$(function(){
    $('#tree').jstree({ 'core' : {
        'data' : [
           { "id" : "ajson1", "parent" : "#", "text" : "Simple root node" },
           { "id" : "ajson2", "parent" : "#", "text" : "Root node 2" },
           { "id" : "ajson3", "parent" : "ajson2", "text" : "Child 1" },
           { "id" : "ajson4", "parent" : "ajson2", "text" : "Child 2" },
        ]
    } });
    $('div.split-pane').splitPane();
});

var fs = require("fs")
var path = require("path")
var dir = '.'; //引数が無いときはカレントディレクトリを対象とする

var walk = function(p, fileCallback, errCallback) {

fs.readdir(p, function(err, files) {
    if (err) {
        errCallback(err);
        return;
    }

    files.forEach(function(f) {
        var fp = path.join(p, f); // to full-path
        if(fs.statSync(fp).isDirectory()) {
            walk(fp, fileCallback); // ディレクトリなら再帰
        } else {
            fileCallback(fp); // ファイルならコールバックで通知
        }
    });
});
};


// 使う方
walk(dir, function(path) {
console.log(path); // ファイル１つ受信  
}, function(err) {
// alert("Receive err:" + err); // エラー受信
});