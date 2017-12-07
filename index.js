window.jQuery = window.$ = require('jquery');

require('jstree')
require('split-pane')

var electron = require('electron');
var remote = electron.remote;
var BrowserWindow = remote.BrowserWindow;
var dialog = remote.dialog;
var fs = require("fs");
var path = require("path");

/** @description Get directory structure JSON for jstree
 * 
 * @param {string} rootDir root directory name
 * @return {json} directory structure JSON data
 */
var GetJson = (rootDir, ignoreNames) => {
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
			let isIgnore = false
			for(name of ignoreNames){
				if(fp.includes(name)) isIgnore = true;
			}
			if(isIgnore) continue;
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
		let isFound = false;
		// '{' position
		let bracketBeginPos = 0;
		$("#right-content").append("<h2> settings of " + data.node.id + "</h2>");
		for(let i = 0; i < lines.length; i++){
			// save '{' position
			if(lines[i] === '{'){
				var key = lines[i-1];
				if(key === 'FoamFile') continue;
				bracketBeginPos = i+1;
				isFound = true;					   
			}				
			// when apper '}', draw text and save to dictionray
			else if(lines[i] === '}' && isFound === true){
				let value = '';
				$("#right-content").append("<h3>" + key + "</h3>");
				for(let j = bracketBeginPos; j < i; j++){
					value += lines[j];
					$("#right-content").append("<input type=text class="+key+" id="+key+'_'+j+" value=\""+lines[j].trim()+"\" style=\"width:100%\">");
					$("#right-content").append("<br>");
				}
				dictionary[key] = value;	
			}
		}

		// save file button
		$("#right-content").append("<h2> save file </h2>");
		$("#right-content").append("<br><input type=text id=filesave value="+data.node.id+">");
		$("#right-content").append("<button id=saveButton>save</button>");

		// save text to file
		$('#saveButton').click( function(){ 
			alert("\""+$('#filesave').val()+'\"'+" is saved.");
			let saveText = '';
			for(let j=0;textHead[j]!=null;j++){
				saveText += textHead[j]+'\n';
			}

			for(key in dictionary){
				let keyvalue = "";
				let inputIds = [];
				$('.'+key).each(function() {		
						 inputIds.push($(this).attr('id'));
					});
					
				for(inputId of inputIds){
					keyvalue += $('#'+inputId).val() + '\n';
				}
				
				saveText += key+"\n";
				saveText += "{\n";
				saveText += keyvalue;
				saveText += "}\n";
				saveText += "\n";
				
			}
			fs.writeFile($('#filesave').val(),saveText);
		});
	});
}

// jquery ready...
$(function () {
	$('#dir-chooser').change(function(data){
		console.log($(this).val());
		$('#tree').jstree(true).settings.core.data = GetJson('/home/kurenaif/Desktop', []);
		$('#tree').jstree(true).refresh(true);
	});
	$('#tree').on({
		'select_node.jstree': event
		})
	.jstree({
		'core': {
		"isFound_callback": true,
		"themes": { "name": 'proton' },
		'data': GetJson(".", ['node_modules'])
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

	$('#folderSelect').on('click', function(){
        var focusedWindow = BrowserWindow.getFocusedWindow();

        dialog.showOpenDialog(focusedWindow, {
            properties: ['openDirectory']
        }, function(directories){
            directories.forEach(function(directory){
                console.log(directory);
            });
        });
    });
});
