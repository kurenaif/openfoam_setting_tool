window.jQuery = window.$ = require('jquery');

require('jstree');
require('split-pane');

const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const fs = require('fs');
const path = require('path');

/** @description get is argument value Object(without array)
 * 
 * @param {*} o value for judgement
 */
var isObject = function (o) {
	return (o instanceof Object && !(o instanceof Array)) ? true : false;
};

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

/** @description read data structure from strings
 * 
 * @param {*} lines string datas
 * @param {*} pos begin position
 */
var GetValues = (lines, pos) => {
	let key = lines[pos];
	let dictionary = {};
	let value = [];
	for (let i = pos + 2; i < lines.length; i++) {
		// when apper '}', draw text and save to dictionray
		if (lines[i + 1] === '{') {
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

/** @description Get array last value
 * 
 * @param {*} array array to get last value
 */
var GetLastValue = (array) => {
	return array[array.length-1];
};

/** @description Make HTML file from dictionary data 
 * 
 * @param {*} dictionary dictionary data
 * @param {*} key key
 * @param {*} depth recursive depth
 */
var GetHTMLText = (dictionary, key = 'null', depth = 0) => {
	let res = '';
	let lastKey = GetLastValue(key.split('_'));
	if (lastKey !== 'null') {
		res += '<h' + (depth + 1) + ' id=body>' + lastKey + '</h' + (depth + 1) + '>';
	} 
	console.log('<h' + (depth + 1) + ' id=body>' + key + '</h' + (depth + 1) + '>');

	console.log('key:', key);
	let cnt = 0;
	for (let v of dictionary) {
		if (isObject(v)) {
			for (let k in v) {
				res += GetHTMLText(v[k], key + '_' + k, depth + 1);
			}
		}
		else {
			console.log(v);
			res += '<input type=text class=' + key + ' id=' + key + '|' + cnt + ' value="' + v + '" style="width:100%">' + '<br>';
		}
		cnt++;
	}
	return res;
};

/** @description make saveText from dictionary & input form
 * 
 * @param {*} dictionary dictionray data
 * @param {*} key key
 * @param {*} lastKey key 
 * @param {*} depth recursive depth
 */
var getSaveText = (dictionary, key = 'null', lastKey = 'null', depth = 0) => {
	let res = '';
	if(lastKey !== 'null'){
		for(let i=0;i<depth-1;i++) res += '\t';
		res += lastKey + '\n';
		for(let i=0;i<depth-1;i++) res += '\t';
		res += '{\n';
	}
	$('.' + key).each(function () {
		console.log($(this).val());
		for(let i=0;i<depth;i++) res += '\t';
		res += $(this).val() + '\n';
	});
	for (let v of dictionary) {
		if (isObject(v)) {
			for (let k in v) {
				res += getSaveText(v[k], key + '_' + k, k , depth + 1) + '\n';
			}
		}
	}
	if(lastKey !== 'null'){
		for(let i=0;i<depth-1;i++) res += '\t';
		console.log('}');
		res += '}' + '\n';
	}
	return res;
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
				if ([0] == '/' && l[1] == '/') continue;
				if (l == '') continue;
				textBody.push(l);
			}
		}
		// OpenFOAM setting dictionray
		// e.g.){
		// ddtSchemes: default Euler,
		// gradSchemes: Gauss linear,
		// ...
		// }
		let dictionary = [];
		$('#right-content').append('<h2 id=title> settings of ' + data.node.id + '</h2>');
		for (let i = 0; i < textBody.length - 1; i++) {
			if (textBody[i + 1] === '{') {
				let values = GetValues(textBody, i);
				let v = values.value;
				i = values.pos;
				dictionary.push(v);
			}
			else {
				dictionary.push(textBody[i]);
			}
		}
		console.log(dictionary);
		console.log(GetHTMLText(dictionary));
		$("#right-content").append(GetHTMLText(dictionary));
		// save file button
		$('#right-content').append('<h2> save file </h2>');
		$('#right-content').append('<br><input type=text id=filesave value=' + data.node.id + '>');
		$('#right-content').append('<button id=saveButton>save</button>');
		// save text to file
		$('#saveButton').click(function () {
			let saveText = '';
			for(let v of textHead){
				saveText += v + '\n';
			}
			saveText +=  getSaveText(dictionary);
			fs.writeFile($('#filesave').val(), saveText);
		});
	});
};

// jquery ready...
$(function () {
	// event when change folder
	$('#dir-chooser').change(function () {
		$('#tree').jstree(true).settings.core.data = GetJson($(this).val(), []);
		$('#tree').jstree(true).refresh(true);
	});
	// [left-panel] launch file viewer
	$('#tree').on({
		'select_node.jstree': event
	}).jstree({
		'core': {
			'isFound_callback': true,
			'themes': { 'name': 'proton' },
			'data': GetJson('.', ['node_modules'])
		},
		'types': {
			'folder': {

				'icon': 'glyphicon glyphicon-folder-open'
			},
			'file': {
				'icon': 'glyphicon glyphicon-file'
			}
		},
		'plugins': ['types'],
	});
	$('div.split-pane').splitPane();

	// folder select behavior
	$('#folderSelect').on('click', function () {
		let focusedWindow = BrowserWindow.getFocusedWindow();

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
