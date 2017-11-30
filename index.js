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
		let rootDirPathArray = rootDir.split("/");
	// response json data
	let resJSON = [{
		"id": rootDir,
			"type": "folder",
			"parent": "#",
			"text": rootDir
	}]

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
				if (pathArray.length === rootDirPathArray.length) {
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
				if (pathArray.length === rootDirPathArray.length) {
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
	// read file from data.node.id => text
	// text: line1\nline2\nline3....
	fs.readFile(data.node.id, 'utf8', function(error, text) {
		// reset canvas
		$("#right-content").html("");
		// lines: [line1, line2, line3, ...]
		let lines = text.split('\n');

		let textHead = {};
		let textBody = {};
		// split text head and body
		for(let i=0; i<lines.length; i++){
			// first 16lines is header
			if(i<16){
				textHead[i] = lines[i];
			}
			// other is body
			else{
				textBody[i] = lines[i];
			}
		}
		// OpenFOAM setting dictionray
		// e.g.){
		// ddtSchemes: default Euler,
		// gradSchemes: Gauss linear,
		// ...
		// }
		let dictionary = {};
		let dictionary2 = {};
		let dictionary3 = {};
		let isFound = false;
		// '{' position
		let bracketBeginPos = 0;
		for(let i = 0; i < lines.length; i++){
			// save '{' position
			if(lines[i] === '{'){
				var key = lines[i-1];
				if(key === 'FoamFile') continue;
				dictionary2[key] = i+1;
				bracketBeginPos = i+1;
				isFound = true;					   
			}				
			else if(lines[i] === '}' && isFound === true){
				let value = '';
			    dictionary3[key] = i-1;
				for(let j = bracketBeginPos; j < i; j++){
					value += lines[j];
				}
				$("#right-content").append("<p>" + key + "</p>");
				for(let k = dictionary2[key]; k < dictionary3[key]+1; k++){
					$("#right-content").append("<input type=text class="+key+" id="+key+'_'+k+" value=\""+lines[k].trim()+"\" style=\"width:100%\">");
					$("#right-content").append("<br>");
				}
				// $("#right-content").append("<input type=text class=test id="+key+" value=\""+value+"\">");
				dictionary[key] = value;	
			}
		}
		$("#right-content").append("<button id=saveButton>save</button>");
		$('#saveButton').click( function(){
			var text3 = '';
			var j = 0;
			while(textHead[j]!=null){
				text3 += textHead[j]+'\n';
				j++;
			}

			for(key in dictionary){
				//console.log(key);
				//console.log($('#'+key).val());
				let keyvalue = "";
				let inputIds = [];
				$('.'+key).each(function() {		
						 inputIds.push($(this).attr('id'));
					});
					
				for(inputId of inputIds){
					keyvalue += $('#'+inputId).val() + '\n';
				}
				
				text3 += key;
					text3 += "{\n";
					
					text3 += keyvalue;
				text3 += "\n";
					text3 += "}\n";
				text3 += "\n";
				
			}
			fs.writeFile('text3.txt',text3);
		});
	});
}

// jquery ready...
$(function () {
		console.log(GetJson("."));
		$('#tree').on({
			'select_node.jstree': event
			})
		.jstree({
			'core': {
			"isFound_callback": true,
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
