var testUri= "";
var testIndex = 0;
var testArray = null;

function updateProgress(){
	//update progress bar
	
	if(testIndex<testArray.length){
		//compile each test here:
		compileTest(testArray[testIndex].uri);
		
		//increment the index in test array
		testIndex++;
	}else{
		// alert("compilation completed");
		endCompilation(testUri);
	}
}

function initCompilation(uri){
	$("#initCompilation").hide();
	
	$.ajax({
		type: "POST",
		url: "/taoDelivery/Delivery/initCompilation",
		dataType: "json",
		data: "uri="+uri,
		success: function(r){
			//save the tests data in a global value
			testUri = r.uri;
			testArray = r.tests;
			
			//table creation
			var testTable = '<table id="user-list" class="ui-jqgrid-btable" cellspacing="0" cellpadding="0" border="0" role="grid" aria-multiselectable="false" aria-labelledby="gbox_user-list" style="width: 1047px;">'
				+'<thead>'
				+'<tr class="ui-jqgrid-labels" role="rowheader">' 
				+ '<th class="ui-state-default ui-th-column " role="columnheader" style="width: 10px;">Test no</th>'
				+ '<th class="ui-state-default ui-th-column " role="columnheader" style="width: 100px;">Test Label</th>'
				+ '<th class="ui-state-default ui-th-column " role="columnheader" style="width: 250px;"></th>'
				+ '</tr></thead><tbody>';
			var clazz = '';
			
			for (j = 0; j < testArray.length; j++){
				if ((j % 2) == 0)
					clazz = "even";
				else
					clazz = "odd";
				
				var testStatus="stand by";
				
				url="#";
				testTable += '<tr class="ui-widget-content jqgrow ' + clazz + '">';
				testTable += '<td style="text-align: center;" role="gridcell">'+ (j+1) +'</td>';
				testTable += '<td style="text-align: center;" role="gridcell"><b>'+ r.tests[j].label +'</b></td>';
				testTable += '<td style="text-align: center;" role="gridcell"><span id="test'+getTestId(r.tests[j].uri)+'">'+ testStatus +'</span></td>';
				testTable += '</tr>';
				testTable += '<tr><td colspan="3" id="result'+getTestId(r.tests[j].uri)+'" class="ui-widget-content jqgrow ' + clazz + '"></td></tr>';
			}
			testTable += '</tbody></table>';
			
			$("#tests").html(testTable);
			
			updateProgress();
		}
	});
}

function getTestId(uri){
	return uri.substr(uri.indexOf(".rdf#")+5);
}

function compileTest(testUri){
	var testTag="#test"+testUri.substr(testUri.indexOf(".rdf#")+5);
	$(testTag).html("compiling...");
	var data="uri="+testUri;
	var success="";
	$.ajax({
		type: "POST",
		url: "/taoDelivery/Delivery/compile",
		data: data,
		dataType: "json",
		success: function(r){
		
			if(r.success==1){
				$(testTag).html("ok");
				updateProgress();
			}else{
				if(r.success==2){
					$(testTag).html("compiled with warning");
				}else{
					$(testTag).html("compilation failed");
				}
				
				resultTag="#result"+testUri.substr(testUri.indexOf(".rdf#")+5);
				errorMessage="";
				failedCopy="";
				failedCreation="";
				for(key in r.failed.copiedFiles) {

					failedCopy+="the following file(s) could not be copied for the test "+key+":";
					
					for(i=0;i<r.failed.copiedFiles[key].length;i++) {
						failedCopy+="<ul>";
						failedCopy+="<li>"+r.failed.copiedFiles[key][i]+"</li>";
						failedCopy+="</ul>";
					}
				}
				
				for(key in r.failed.createdFiles) {
				
					failedCreation+="the following file(s) could not be created for the test:";
					
					for(i=0;i<r.failed.createdFiles[key].length;i++) {
						failedCreation+="<ul>";
						failedCreation+="<li>"+r.failed.createdFiles[key][i]+"</li>";
						failedCreation+="</ul>";
					}
				}
				
				errorMessage="<div>";
				errorMessage+=failedCopy;
				errorMessage+="<br/><br/>";
				errorMessage+=failedCreation;
				errorMessage+='<br/><br/><a href="#" onclick="$(\''+resultTag+'\').hide(); return false;">close</a>';
				errorMessage+="</div>";
				
				$(resultTag).html(errorMessage);
				
				//reinitiate the values and suggest recompilation
				testIndex = 0;
				testArray = null;
				$("#initCompilation").html("Recompile the delivery");
			}
		}//end success function callback
	});
}

function endCompilation(uri){
	//reinitiate the value
	testIndex = 0;
	testArray = null;
	
	$.ajax({
		type: "POST",
		url: "/taoDelivery/Delivery/endCompilation",
		data: "uri="+uri,
		dataType: "json",
		success: function(r){
			if(r.result == 1){
				$("#initCompilation").html("Recompile the delivery").show();
			}else{
				alert("the delivery has been successfully compiled but an issue happened with the delivery status update");
			}
		}
	});	
}