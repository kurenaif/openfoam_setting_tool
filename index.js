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
	var fs = require('fs');
	//$("#right-content").html(data.node.id + ":" + data.node.type ); 
	fs.readFile(data.node.id, 'utf8', function(error, text) {
			var dictionary = {};

			$("#right-content").html("");
			console.log(text.split('\n'));
			var text2 = text.split('\n');
			for(let i=0; i<text2.length; i++){
				if(text2[i] === '{'){
					var key = text2[i-1];
					var a = i+1;
				}
				else if(text2[i] === '}'){
				  var value = '';
					for(let j=a; j<i; j++){
						value += text2[j];
					}
				  $("#right-content").append("<p>key:" + key + "<br>values:<br>" + value.replace(/\r?\n/g,"<br>") + "</p>");
			dictionary[key] = value;	
			}
			console.log(dictionary);
			}
		} );
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
