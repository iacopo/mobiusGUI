/* configurable parameters */

var defaultCFG_URL = 'syscfg/SYSCFG.TXT'; //this is where I put the default SYSCFG file generated by the latest firmware

/* globals */

var SYSCFG;
var parameters;
var defaultParameters;
var version;
var userLoaded;
var acceptedFirmware = [59, 113, 117, 120]

$(document).ready(function(){
	$.get(defaultCFG_URL, function(content) {
		/* $("#displayFile").text(content); //debug display content of txt file */
		SYSCFG = content;
		updateParameters();
		defaultParameters = parameters;
		displaySettings();
	});
	
    //drag and drop listeners.
	var dropZone = document.getElementById('drop_area');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('dragleave', handleDragLeave, false);
	dropZone.addEventListener('drop', handleFileSelect, false);

	document.getElementById('files').addEventListener('change', handleFileSelect, false);
	
	$('.button').click(applySettings);
	
	$("[data-minFw]").hide();
});

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.	

	$('#drop_area').addClass('drag');
}

function handleDragLeave(evt) {
	$('#drop_area').removeClass('drag');
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	if (evt.dataTransfer) {
		// console.log("data transfer!!")
		var files = evt.dataTransfer.files; // FileList object.
	}
	else if (evt.target) {
		// console.log("target!!")
		var files = evt.target.files; // FileList object DA BOTTONE INPUT
	}
		
	// files is a FileList of File objects. I'll just take the first file
	var file = files[0];
	var reader = new FileReader();
	
	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			SYSCFG = evt.target.result;
			updateParameters();
			// console.log(SYSCFG);
		}
	};
	
	reader.readAsText(file);
}


function twoDigits(n){
    return n > 9 ? "" + n: "0" + n;
}

function writeParameter(position, value){
	var nth = 0;
	SYSCFG = SYSCFG.replace(/[^[]+(?=\])/g, function(match) {
		nth++;
		if (nth == position+1) {return value}
		else {return match}
	});
	updateParameters();
	// console.log("write par" + position + " = " + value);
}

function updateParameters() {
	parameters = SYSCFG.match(/[^[]+(?=\])/g);//this generates an array that contains all the values found between brackets []
	version = SYSCFG.match(/v[^{]+(?=\})/g);
	version = parseInt(version[0].substring(1).replace('.', ''), 10);
	//console.log(version);
	//console.log(parameters);
}


// #### salvataggio file con PHP  ####

function saveWithPHP() {
	$('<form action="savefile.php" method="POST">' + 
	'<input type="hidden" name="text" value="' + SYSCFG + '">' +
	'</form>').submit();
	if (readInputValue('dateTime') == 2) {
		clearTimeout(timeout);
		mins = 2;
		secs = mins * 60;
		countdown();
		$('html, body').animate({scrollTop:0}, 'slow');
	}
	else {
		clearTimeout(timeout);
		$('#drop_area span').text('Load your file to the camera and follow the update procedure.');
	}
}

// #### salvataggio file come blob html5  ####

function SaveSYSCFG() {
	if (userLoaded == 1){
		var blob = new Blob([SYSCFG], {type: "text/plain;charset=utf-8"});
		saveAs(blob, "SYSCFG.TXT");
	}
	else {
		alert("You haven't successfully loaded a SYSCFG.TXT file, please also make sure your camera has firmware 0.59 or higher");
	}
}


function applySettings() {
	//check for conflicts

	//read value of each input, put it back to the main variable
	for (var i = 0; i < parameters.length; i++) {

		writeParameter(i, i); // if (newValue) perchè non devo scrivere niente se non esiste il campo con il nome=i (ad esempio i==2 e i==4 non esistono)
		// console.log('parameter' + i + " = " + parameters[i]);
	}

	if (navigator.userAgent.match(/Firefox/i) != null) {SaveSYSCFG();} //Save from javascript in Firefox
	else {saveWithPHP();} //save from php with every other browser
}