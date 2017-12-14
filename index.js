window.jQuery = window.$ = require('jquery');

require('jstree');
require('split-pane');

const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const fs = require('fs');
const path = require('path');

/** @description Get directory structure JSON for jstree
 * 
 * @param {string} rootDir root directory name
 * @return {json} directory structure JSON data
 */
var GetJson = (rootDir, ignoreNames) => {
	// directory queue for BFS search
	let dirQueue = [rootDir];
	let rootDirPathArray = rootDir.split('/');
	// response json data
	let resJSON = [{
		'id': rootDir,
		'type': 'folder',
		'parent': '#',
		'text': rootDir
	}];

	while (dirQueue.length > 0) {
		let p = dirQueue[0];
		dirQueue.shift();
		let files = fs.readdirSync(p);

		for (let i = 0; i < files.length; i++) {
			let f = files[i];
			let fp = path.join(p, f); // to full-path
			let isIgnore = false;
			for (let name of ignoreNames) {
				if (fp.includes(name)) isIgnore = true;
			}
			if (isIgnore) continue;
			if (fs.statSync(fp).isDirectory()) {
				dirQueue.push(fp);
				let pathArray = fp.split('/');
				if (pathArray.length === rootDirPathArray.length) {
					let file = fp;
					resJSON.push({
						'id': fp,
						'type': 'folder',
						'parent': '#',
						'text': file
					});
				}
				else {
					let file = pathArray[pathArray.length - 1];
					let parent = fp.slice(0, -file.length - 1);
					resJSON.push({
						'id': fp,
						'type': 'folder',
						'parent': parent,
						'text': file
					});
				}
			} else {
				let pathArray = fp.split('/');
				if (pathArray.length === rootDirPathArray.length) {
					let file = fp;
					resJSON.push({
						'id': fp,
						'type': 'file',
						'parent': '#',
						'text': file
					});
				}
				else {
					let file = pathArray[pathArray.length - 1];
					let parent = fp.slice(0, -file.length - 1);
					resJSON.push({
						'id': fp,
						'type': 'file',
						'parent': parent,
						'text': file
					});
				}
			}
		}
	}
	return resJSON;
};

var GetValues = (lines, pos) => {
	let key = lines[pos];
	let dictionary = {};
	let value = [];
	for (let i = pos + 2; i < lines.length; i++) {
		// when apper '}', draw text and save to dictionray
		if (lines[i+1] === '{') {
			let v = GetValues(lines, i);
			value.push(v.value);
			i = v.pos;
		}
		else if (lines[i].trim() === '}') {
			dictionary[key] = value;
			return { 'value': dictionary, 'pos': i };
		}
		else if (lines[i + 1].trim() !== '{') {
			value.push(lines[i]);
		}
	}
	return value;
};

var GetHTMLText = (lines, pos) => {
	let key = lines[pos];
	let dictionary = {};
	let value = [];
	for (let i = pos + 2; i < lines.length; i++) {
		// when apper '}', draw text and save to dictionray
		if (lines[i+1] === '{') {
			let v = GetValues(lines, i);
			value.push(v.value);
			i = v.pos;
		}
		else if (lines[i].trim() === '}') {
			dictionary[key] = value;
			return { 'value': dictionary, 'pos': i };
		}
		else if (lines[i + 1].trim() !== '{') {
			value.push(lines[i]);
		}
	}
	return value;
};

/** @description event handler for jstree select
 * 
 * @param {*} event event
 * @param {*} data selected data
 */
var event = (event, data) => {
	// read file from data.node.id => text
	// text: line1\nline2\nline3....
	fs.readFile(data.node.id, 'utf8', function (error, text) {
		// reset canvas
		$('#right-content').html('');
		// lines: [line1, line2, line3, ...]
		let lines = text.split('\n');

		let textHead = [];
		let textBody = [];
		// split text head and body
		for (let i = 0; i < lines.length; i++) {
			// first 16lines is header
			if (i < 16) {
				textHead[i] = lines[i];
			}
			// other is body
			else {
				let l = lines[i].trim();
				if([0] == '/' && l[1] == '/') continue;
				if(l == '') continue;
				textBody.push(l);
			}
		}
		// OpenFOAM setting dictionray
		// e.g.){
		// ddtSchemes: default Euler,
		// gradSchemes: Gauss linear,
		// ...
		// }
		let dictionary = {};
		let inSide = 0;
		let isFound = false;
		// '{' position
		let bracketBeginPos = 0;
		$('#right-content').append('<h2> settings of ' + data.node.id + '</h2>');
		for (let i = 0; i < textBody.length-1; i++) {
			if(textBody[i+1] === '{'){
				let values = GetValues(textBody, i);
				let v = values.value;
				i = values.pos;
				$.extend(dictionary, v);
			}
			else{
				dictionary['null'] = textBody[i];
			}
		}
		console.log(dictionary);
	});
};

// jquery ready...
$(function () {
	$('#dir-chooser').change(function (data) {
		console.log($(this).val());
		$('#tree').jstree(true).settings.core.data = GetJson('/home/kurenaif/Desktop', []);
		$('#tree').jstree(true).refresh(true);
	});
	$('#tree').on({
		'select_node.jstree': event
	}).jstree({
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

	$('#folderSelect').on('click', function () {
		var focusedWindow = BrowserWindow.getFocusedWindow();

		dialog.showOpenDialog(focusedWindow, {
			properties: ['openDirectory']
		}, function (directories) {
			directories.forEach(function (directory) {
				$('#tree').jstree(true).settings.core.data = GetJson(directory, []);
				$('#tree').jstree(true).refresh(true);
			});
		});
	});
});
