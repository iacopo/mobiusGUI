/* configurable parameters */

var defaultCFG_URL = 'syscfg/SYSCFGv2.TXT'; //this is where I put the default SYSCFG file generated by the latest firmware

/* globals */

var SYSCFG;
var parameters;
var defaultParameters;
var version;
var userLoaded;

$(document).ready(function(){
	$.get(defaultCFG_URL, function(content) {
		/* $("#displayFile").text(content); //debug display content of txt file */
		SYSCFG = content;
		updateParameters();
		defaultParameters = parameters;
		displaySettings();
	});

	SYSCFG = $('pre').text();
	updateParameters();
	displaySettings();
	console.log(SYSCFG);
	
	$('.button').click(applySettings);
	
	// $("[data-minFw]").hide();

	$('#drop_area span').text('File loaded successfully - firmware version ' + version/100);
	displaySettings();
	userLoaded = 1;
});

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

function readInputValue(index){
	var input = $('[name='+index+']');
	if (input.length != 0) {
		if ( input.is('[type=radio]') )		{
			if ($('[name='+index+']:checked').val() == 0) {return "0";} //this is because javascript hates values of 0
			else {return parseInt( $('[name='+index+']:checked').val() );}
		}
		else if ( input.is('[type=number]') )	{
			if ( parseInt(input.attr('min')) <= parseInt(input.val()) && parseInt(input.val()) <= parseInt(input.attr('max')) ){
				if (input.val() == 0) {return "0";} //this is because javascript hates values of 0
				else {return parseInt( input.val() );}
			}
			else {
				whatswrong = input.closest('div').siblings().text();
				alert("One or more values entered for " + whatswrong + "\nare out of the acceptable range.\nI will replace it with the default value.\n\nThe range is: [" + input.attr('min') + ";" + input.attr('max') + "]");
				input.val(defaultParameters[index]);
				return defaultParameters[index];
			}
		}
	}
}

//Drag and drop file reading... user drops a SYSCFG.TXT on the drop area, and script reads it.
function displayParameter(index, value){
	//check if element exists, if it does, assign its value to it.
	var input = $('[name='+index+']');
	if (input.length != 0) {
		if ( input.is('[type=radio]') ) 		{input[value].checked = true;}
		else if ( input.is('[type=number]') )	{
			if (value.charAt(0) == "+"){input.val(value.substring(1));} //if strings begins with + remove the + sign
			else {input.val(value);}
		}
	}
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

// #### timer per chi vuole sincronizzare orologio camera con orologio computer ####

// Setto qualche global necessaria
var timeout;
var secs;
var mins;

function countdown() {
	timeout = setTimeout('Decrement()',1000);
}
function Decrement() {
	if (document.getElementById) {
		
		if (secs < 0) {
			$('#drop_area span').text('Press mode + power button now!');
		}
		else if (secs < 59) {
			$('#drop_area span').text('Load your file and get ready to press mode + power button in 00:' + twoDigits(secs));
		} else {
			$('#drop_area span').text('Load your file and get ready to press mode + power button in ' + getminutes() + ':' + getseconds());
		}
		secs--;
		timeout = setTimeout('Decrement()',1000);
	}
}

function getminutes() {
	// minutes is seconds divided by 60, rounded down
	mins = Math.floor(secs / 60);
	return twoDigits(mins);
}
function getseconds() {
	// take mins remaining (as seconds) away from total seconds remaining
	return twoDigits(secs-Math.round(mins *60));
}



// #####################################
// ##                                 ##
// ## le eccezioni varie iniziano qui ##
// ##                                 ##
// #####################################


function applySettings() {
	//check for conflicts
	checkConflictsOut();

	//read value of each input, put it back to the main variable
	for (var i = 0; i < parameters.length; i++) {

		var newValue = readInputValue(i);

		if (i == 1 || i == 3) {
			prameterIndex = i+1;
			if ( $('[name='+i+']:checked').val()==4 ){
				newValue = 3;
				writeParameter(prameterIndex, 1);
				writeParameter(i, newValue);
			}
			if ( $('[name='+i+']:checked').val()<4 ){
				writeParameter(prameterIndex, 2);
				writeParameter(i, newValue);
			}
		}
		else if ( newValue ) { writeParameter(i, newValue); } // if (newValue) perchè non devo scrivere niente se non esiste il campo con il nome=i (ad esempio i==2 e i==4 non esistono)
		// console.log('parameter' + i + " = " + parameters[i]);
	}

	

	var video1Flip = readInputValue('video1Flip');
	var video2Flip = readInputValue('video2Flip')*2; //multiply x2 so that it returns either 0 or 2, so the sum of this + video1Flip returns a value [0-3].
	var videosFlip = video1Flip + video2Flip;
	var videosFlip = parseInt(videosFlip, 4); //this is a nightmare......

	writeParameter(12, videosFlip);

	if (readInputValue('dateTime') == 1) { updateDate(0); }
	else if (readInputValue('dateTime') == 2) { updateDate(2); }
	else {writeParameter(0, "????/??/??-??:??:??");}


	if (navigator.userAgent.match(/Firefox/i) != null) {SaveSYSCFG();} //Save from javascript in Firefox
	else {saveWithPHP();} //save from php with every other browser
}

function displaySettings(){
	for (var i = 0; i < parameters.length; i++) {
		checkMinMax(i); //check if the parameter is in its range

		//check if element exists, if it does, assign it's value.
		displayParameter(i, parameters[i]);
	}

	if (parameters[1]==3 && parameters[2]==1) {displayParameter(1, 4)}
	if (parameters[3]==3 && parameters[4]==1) {displayParameter(3, 4)}

	switch (parameters[12]) {
		case "0": //both off
			displayParameter('video1Flip', 0);
			displayParameter('video2Flip', 0);
		break;

		case "1": //flip video1
			displayParameter('video1Flip', 1);
			displayParameter('video2Flip', 0);
		break;

		case "2": //flip video2
			displayParameter('video1Flip', 0);
			displayParameter('video2Flip', 1);
		break;

		case "3": //flip both
			displayParameter('video1Flip', 1);
			displayParameter('video2Flip', 1);
		break;
	}
	checkConflictsIn(); //check if there's no conflict between parameters
}


function updateDate(offset) {

// ########### !!!!!!!!! è stato aggiunto cambio di formato!

	var jsDate = new Date();

	jsDate.setMinutes(jsDate.getMinutes()+offset);

	var year = jsDate.getFullYear();
	var month = jsDate.getMonth();
	var day = jsDate.getDate();
	var hours = jsDate.getHours();
	var minutes = jsDate.getMinutes();
	var seconds = jsDate.getSeconds();

	month = month + 1 + "";
	// day = day + "";
	// hours = hours + "";
	// minutes = minutes + "";

	month = twoDigits(month);
	day = twoDigits(day);
	hours = twoDigits(hours);
	minutes = twoDigits(minutes);
	seconds = twoDigits(seconds);

	var mobiusDate = [year, '/', month, '/', day, '-', hours, ':', minutes, ':', seconds ].join("");

	writeParameter(0, mobiusDate);
}

function checkMinMax(i) {
	maxvalue = 10;
	minvalue = 0;

	switch(i) {
		case 2: case 4:
		maxvalue = 2;
		minvalue = 1;
		break;

		case 12:
		maxvalue = 3;
		break;
	}

	if ($('[name='+i+']').length != 0){
		if ( $('[name='+i+']').attr('maxval') ){
			maxvalue = parseInt($('[name='+i+']').attr('maxval'));
			minvalue = parseInt($('[name='+i+']').attr('minval'));
		}
		else if( $('[name='+i+']').attr('max') ){
			maxvalue = parseInt($('[name='+i+']').attr('max'));
			minvalue = parseInt($('[name='+i+']').attr('min'));
		}
		else {
			//if not specified, try to gess it by the number of options with the same name
			maxvalue = $('[name='+i+']').length-1;
			minvalue = 0;
		}
	}

	// console.log("parameter[" + i + "] MIN=" + minvalue + " MAX=" + maxvalue );

	if (parameters[i] > maxvalue || parameters[i] < minvalue) {
		parameters[i] = defaultParameters[i];
		console.log("wrong" + i);
		alert("One or more parameters from your SYSCFG.TXT file are out of their acceptable range.\nI'll use defaults instead.");
	}
}

function checkConflictsIn() {
	if (parameters[26]==1){
		if (parameters[16]!=0 || parameters[6]!=0) {
			alert("Motion detection can't be used together with timelapse and/or automatic power off.\n\nMotion detection will be switched off.");
			displayParameter(26, 0);
			writeParameter(26, 0);
		}
	}

	if (parameters[6]!=0){
		if (parameters[17]!=0 || parameters[18]!=0){
			alert("Time lapse can't be used together with One Power Button to Auto Record and Auto Record with external power.\n\nTime lapse will be switched off.");
			displayParameter(6, 0);
			writeParameter(6, 0);
		}
	}

	if (parameters[9]==1){
		if (parameters[8]==0 || parameters[8]==1) {}
		else {
			alert("Movie loop recording works only when Movie cycle time is set to 3 or 5 minutes.\n\nMovie loop recording will be switched off.");
			displayParameter(9, 0);
			writeParameter(9, 0);
		}
	}
}

function checkConflictsOut() {
	if (readInputValue(26)==1){
		if (readInputValue(16)!=0 || readInputValue(6)!=0) {
			alert("Motion detection can't be used together with timelapse and/or automatic power off.\n\nMotion detection will be switched off.");
			displayParameter(26, 0);
		}
	}

	if (readInputValue(6)!=0){
		if (readInputValue(17)!=0 || readInputValue(18)!=0){
			alert("Time lapse can't be used together with One Power Button to Auto Record and Auto Record with external power.\n\nTime lapse will be switched off.");
			displayParameter(6, 0);
		}
	}

	if (readInputValue(9)==1){
		console.log(readInputValue(8));
		if (readInputValue(8)==0 || readInputValue(8)==1) {} //questo caso va bene, tutti gli altri (else) no
		else {
			displayParameter(9, 0);
			alert("Movie loop recording works only when Movie cycle time is set to 3 or 5 minutes.\n\nMovie loop recording will be switched off.");
		}
	}
}