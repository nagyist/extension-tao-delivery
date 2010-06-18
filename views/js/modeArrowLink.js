alert('ModeArrowLink loaded');

ModeArrowLink = new Object();
ModeArrowLink.tempId = "defaultConnectorId";

ModeArrowLink.on = function(connectorId, port, position){
	
	console.log('ModeArrowLink.on');
	var arrowOriginEltId = ActivityDiagramClass.getActivityId('connector', connectorId, 'bottom', port);
	console.log('arrowOriginEltId: ',arrowOriginEltId);
	
	ModeArrowLink.tempId = arrowOriginEltId;
	
	
	//insert information in the feedback 'div'
	if(!ActivityDiagramClass.setFeedbackMenu('ModeArrowLink')){
		return false;
	}
	
	//reset temp arrow array:
	ArrowClass.tempArrows = [];
	
	//remove original arrow from diagram, but do not delete it completely yet!
	ArrowClass.removeArrow(arrowOriginEltId, false);
	
	
	//create a temporary arrow
	var tempArrow = ModeArrowLink.createDraggableTempArrow(arrowOriginEltId, position);
	ModeArrowLink.tempId = tempArrow.id;
	
	//set droppable points:
	ModeArrowLink.activateAllDroppablePoints(connectorId);
	
	return true;
}

ModeArrowLink.activateAllDroppablePoints = function(excludedConnectorId){

	for(connectorId in ActivityDiagramClass.connectors){
		if(excludedConnectorId == connectorId){
			continue;
		}
		
		ModeArrowLink.activateDroppablePoint(ActivityDiagramClass.getActivityId('connector', connectorId, 'left'));
		ModeArrowLink.activateDroppablePoint(ActivityDiagramClass.getActivityId('connector', connectorId, 'right'));
	}
	
	for(activityId in ActivityDiagramClass.activities){
		// console.log('a_id', activityId);
		// console.log('c_l', ActivityDiagramClass.getActivityId('activity', activityId, 'top'));
		ModeArrowLink.activateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'top'));
		ModeArrowLink.activateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'left'));
		ModeArrowLink.activateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'right'));
	}
	
}

ModeArrowLink.deactivateAllDroppablePoints = function(){
	for(connectorId in ActivityDiagramClass.connectors){
		ModeArrowLink.deactivateDroppablePoint(ActivityDiagramClass.getActivityId('connector', connectorId, 'left'));
		ModeArrowLink.deactivateDroppablePoint(ActivityDiagramClass.getActivityId('connector', connectorId, 'right'));
	}
	
	for(activityId in ActivityDiagramClass.activities){
		// console.log('a_id', activityId);
		// console.log('c_l', ActivityDiagramClass.getActivityId('activity', activityId, 'top'));
		ModeArrowLink.deactivateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'top'));
		ModeArrowLink.deactivateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'left'));
		ModeArrowLink.deactivateDroppablePoint(ActivityDiagramClass.getActivityId('activity', activityId, 'right'));
	}
	
}

ModeArrowLink.createDraggableTempArrow = function(originId, position){
	
	//delete old one if exists
	// ArrowClass.tempArrows[originId] = {
		// 'targetObject': targetObjectId,
		// 'target': 'freeArrowTip',
		// 'type': 'top'
	// }
	
	//initialize the arrow tip position:
	if(!position.left){
		left = 0;
	}else{
		left = position.left;
	}
	if(!position.top){
		top = 0;
	}else{
		top = position.top;
	}
	
	//add the arrow tip element
	var tipId = originId + '_tip';
	var elementTip = $('<div id="'+tipId+'"></div>');//put connector id here instead
	elementTip.addClass('diagram_arrow_tip');
	elementTip.css('position', 'absolute');
	elementTip.css('left', Math.round(left)+'px');
	elementTip.css('top', Math.round(top)+'px');
	elementTip.appendTo(ActivityDiagramClass.canvas);
	
	//calculate the initial position & draw it
	ArrowClass.tempArrows[originId] = ArrowClass.calculateArrow($('#'+originId),$('#'+tipId), 'top', null, true);
	ArrowClass.drawArrow(originId, {
		container: ActivityDiagramClass.canvas,
		arrowWidth: 2,
		temp: true
	});
	
	//transform to draggable
	$('#'+elementTip.attr('id')).draggable({
		snap: '.diagram_activity_border_point',
		snapMode: 'inner',
		drag: function(event, ui){
			
			// var position = $(this).position();
			// $("#message").html("<p> left: "+position.left+", top: "+position.top+"</p>");
			var id = $(this).attr('id');
			var arrowName = id.substring(0,id.indexOf('_tip'));
			
			//retrieve the arrow object in the temp arrows global array:
			var arrow = ArrowClass.tempArrows[arrowName];
			
			//TODO edit 'type' at the same time:
			
			ArrowClass.removeArrow(arrowName,false,true);
			ArrowClass.tempArrows[arrowName] = ArrowClass.calculateArrow($('#'+arrowName), $(this), arrow.type, null, true);
			ArrowClass.drawArrow(arrowName, {
				container: ActivityDiagramClass.canvas,
				arrowWidth: 2,
				temp: true
			});
		},
		containment: ActivityDiagramClass.canvas,
		stop: function(event, ui){
			var id = $(this).attr('id');
			var arrowName = id.substring(0,id.indexOf('_tip'));
			// getDraggableFlexPoints(arrowName);
			
			ArrowClass.getDraggableFlexPoints(arrowName);
		}
	});
	
	return true;
}

ModeArrowLink.deactivateDroppablePoint = function(DOMElementId){
	var elt = $('#'+DOMElementId);
	if(!elt.length){
		return null;
	}
	
	elt.droppable("destroy");
	elt.css('display','none');//TODO: css to be changed instead
}

ModeArrowLink.activateDroppablePoint = function(DOMElementId){

	var elt = $('#'+DOMElementId);
	if(!elt.length){
		return null;
	}
	
	elt.css('display','block');
	return elt.droppable({
		over: function(event, ui) {
			// console.dir(ui);
			
			var id = $(this).attr('id');
			if(id.indexOf('_c')>0){ 
				return false;
			}else{
				var startIndex = id.indexOf('_pos_');
				var newType = id.substr(startIndex+5); 
				var draggableId = ui.draggable.attr('id');
				var arrowName = draggableId.substring(0,draggableId.indexOf('_tip'));
				
				ArrowClass.tempArrows[arrowName].type = newType;
				ArrowClass.tempArrows[arrowName] = ArrowClass.calculateArrow($('#'+arrowName), $('#'+draggableId), newType, new Array(), true);
								
				//draw new arrow
				ArrowClass.removeArrow(arrowName, false, true);
				ArrowClass.drawArrow(arrowName, {
					container: ActivityDiagramClass.canvas,
					arrowWidth: 2,
					temp: true
				});
				
			}
		},
		drop: function(event, ui) {
			//edit the arrow's 'end' property value and set it to this draggable, so moving the activity will make the update in position of the connected arrows easier
				
				//destroy draggable
				
				//destroy ALL droppable object on the canvas
				// $(this).droppable('destroy');
		}
	});
	
}

ModeArrowLink.save = function(){
	console.log('ModeArrowLink.save:');
	if(ModeArrowLink.tempId){
		// save the temporay arrow data into the actual arrows array:
		if(ArrowsClass.tempArrows[ModeArrowLink.tempId]){
			ArrowsClass.arrows[ModeArrowLink.tempId] = ArrowsClass.tempArrows[ModeArrowLink.tempId];
			
			//delete the temp arrows and draw the actual one:
			ArrowClass.removeArrow(ModeArrowLink.tempId, true, true);
			ArrowClass.drawArrow(ModeArrowLink.tempId, {
				container: ActivityDiagramClass.canvas,
				arrowWidth: 2
			});
		}
	}
	ActivityDiagramClass.unsetFeedbackMenu();
	
	//unquote section below when the communication with server is established:
	/*
	
	//send the coordinate + label to server
	//call processAuthoring/addActivity:
	
	//on success, delete the temp activity:
	ModeActivityAdd.cancel();
	
	//draw the real activity:
	positionData = 'positon of temp activity';
	activityData = [];
	newActivity = ActivityDiagramClass.feedActivity = function(activityData, positionData);//no need for array data since it is not connnected yet
	ActivityDiagramClass.drawActivity(newActivity.id);	
	*/
}

ModeArrowLink.cancel = function(){
	console.log('ModeArrowLink.cancel', ModeArrowLink);
	
	if(ModeArrowLink.tempId){
		if(ArrowsClass.tempArrows[ModeArrowLink.tempId]){
			//delete the temp arrows and draw the actual one:
			console.log('ModeArrowLink.cancel');
			ArrowClass.removeArrow(ModeArrowLink.tempId, true, true);
		}
		
		if(ArrowsClass.arrows[ModeArrowLink.tempId]){
			//redraw the original arrow anyway
			ArrowClass.drawArrow(ModeArrowLink.tempId, {
				container: ActivityDiagramClass.canvas,
				arrowWidth: 2
			});
		}
	}
	
	ActivityDiagramClass.unsetFeedbackMenu();
}