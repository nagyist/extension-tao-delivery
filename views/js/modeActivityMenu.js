// alert('ModeActivityMenu loaded');

ModeActivityMenu = [];
ModeActivityMenu.existingMenu = new Array();

ModeActivityMenu.on = function(options){
	if(options.target){
		switch(options.type){
			case 'activity':{
				ModeActivityMenu.createActivityMenu(options.target);
				break;
			}
			case 'connector':{
				ModeActivityMenu.createConnectorMenu(options.target);
				break;
			}
			case 'arrow':{
				ModeActivityMenu.createArrowMenu(options.target);
				break;
			}
			default:{
				throw 'wrong target type given';
			}
		}
	}
}

ModeActivityMenu.createActivityMenu = function(activityId){
	//create top menu for the activity: first, last, edit, delete
	var containerId = ActivityDiagramClass.getActivityId('activity', activityId);
	var actions = [];
	actions.push({
		label: "Define as the first activity",
		icon: img_url + "flag-green.png",
		action: function(actId){
			console.log('isFirst => ',actId);
		}
	});
	// actions.push({
		// label: "Define as a last activity",
		// icon: img_url + "flag-red.png",
		// action: function(actId){
			// console.log('islast => ',actId);
		// }
	// });
	actions.push({
		label: "Move",
		icon: img_url + "pencil.png",
		action: function(actId){
			// ModeActivityMove.on(actId);
			ModeController.setMode('ModeActivityMove', {activityId: actId});
		}
	});
	actions.push({
		label: "Edit",
		icon: img_url + "pencil.png",
		action: function(actId){
			console.log('edit',actId);
		},
		autoclose: false
	});
	actions.push({
		label: "Delete",
		icon: img_url + "delete.png",
		action: function(actId){
			console.log('delete => ',actId);
		}
	});
	// console.log('actions',actions);
	
	ModeActivityMenu.createMenu(
		activityId,
		containerId,
		'top',
		actions
	);
	// ModeActivityMenu.existingMenu = new Array();
	ModeActivityMenu.existingMenu[containerId] = containerId;
	// console.log("created menus:", ModeActivityMenu.existingMenu);
	
	//depending if the activity had a connector or not, build the bottom menu:
	var connectorActions = [];
	
	//if the activity has a connector:
	var connector = ActivityDiagramClass.getConnectorsByActivity(activityId);
	if(connector.length>0){
		connectorActions.push({
			label: 'Delete connector and set as a final activity',
			icon: img_url + "flag-red.png",
			action: function(actId){
				//go deleting the activity's connector:
				console.log('set as final & delete connector');
			}
		});
	}else{
		//adding a new connector linked connector:
		connectorActions.push({
			label: 'Add a connector',
			icon: img_url + "process_connector.png",
			action: function(actId){
				//go deleting the activity's connector:
				console.log('add connector then draw and switch to connectorMove mode');
			}
		});
	}
	
	var pointId = ActivityDiagramClass.getActivityId('activity', activityId, 'bottom');
	ModeActivityMenu.createMenu(
		activityId,
		pointId,
		'bottom',
		connectorActions,
		{offset:10}
	);
	ModeActivityMenu.existingMenu[pointId] = activityId;
}

ModeActivityMenu.createConnectorMenu = function(connectorId){

	var topContainerId = ActivityDiagramClass.getActivityId('connector', connectorId, 'top');
	actions = [];
	actions.push({
		label: "Move",
		icon: img_url + "pencil.png",
		action: function(actId){
			console.log('move => ',actId);
			ModeConnectorMove.on(actId);
		}
	});
	actions.push({
		label: "Edit",
		icon: img_url + "pencil.png",
		action: function(actId){
			console.log('edit',actId);
			//click on the tree node:
			
		},
		autoclose: false
	});
	actions.push({
		label: "Delete",
		icon: img_url + "delete.png",
		action: function(actId){
			console.log('delete => ',actId);
		}
	});
	ModeActivityMenu.createMenu(
		connectorId,
		topContainerId,
		'top',
		actions,
		{offset:10}
	);
	ModeActivityMenu.existingMenu[topContainerId] = connectorId;
	
	//get connector data:
	if(!ActivityDiagramClass.connectors[connectorId]){
		throw 'the connector does not exist: '+connectorId;
		return false;
	}
	var connector = ActivityDiagramClass.connectors[connectorId];
	
	//get the type of connector, and thus the name of all 'port'
	var connectorTypeDescription = ActivityDiagramClass.getConnectorTypeDescription(connector.type);
	if(connectorTypeDescription == null){
		throw 'wrong type of connector';
		return false;
	}
	
	
	//for each port i, get the id and create a menu with one single option (autoclose set to false)
	
	for(var i=0; i<connectorTypeDescription.portNumber; i++){
		var pointId = ActivityDiagramClass.getActivityId('connector', connectorId, 'bottom', i);
		ModeActivityMenu.createMenu(
			connectorId,
			pointId,
			'bottom',
			[{
				label: connectorTypeDescription.portNames[i],
				icon: img_url + "process_connector.png",
				action: function(connectId, data){
					//hightlight the current one:
					
					//check if an arrow (=connection) exists:
					// if(ArrowClass.arrows[data.arrowId]){
					if(false){//test of else only: delete ArrowClass.arrows[data.arrowId];
						//if so, go to editArrowMode(arrowId)
						// ModeActivityMenu.cancel();
						ModeController.setMode('editArrowMode', {activityId: actId});
					}else{
					
						//remove top connector menu and other connector submenu:
						// ModeActivityMenu.removeMenu(data.topMenuId);//delete only the connectors's top menu
						if(ModeActivityMenu.existingMenu){
							for(containerId in ModeActivityMenu.existingMenu){
								if(containerId != data.menuContainerId){
									ModeActivityMenu.removeMenu(containerId);
									delete ModeActivityMenu.existingMenu[containerId];
								}
							}
						}
					
						//else, menu with 3 items: new activity, new connector, free connection
						var subActions = [];
						subActions.push({
							label: "New Activity",
							icon: img_url + "process_activity.png",
							action: function(id, data, e){
								// ModeConnectedActivityAdd.on('activity', data.connectorId, data.port);
								console.log('ModeConnectedActivityAdd.on("activity", '+data.connectorId+', '+data.port+')');
								
								// var coordXY = ArrowClass.getCenterCoordinate($('#'+e.currentTarget.id));
								//var position = {top:coordXY.y, left:coordXY.y};
								// console.log(e.currentTarget.id, coordXY);
								
								//real offset need to be calculated:
								var canvasPosition = $(ActivityDiagramClass.canvas).offset();
								var position = {left:e.pageX-canvasPosition.left, top:e.pageY-canvasPosition.top};
								
								ModeLinkedActivityAdd.on(data.connectorId, data.port, position);
							}
						});
						subActions.push({
							label: "New Connector",
							icon: img_url + "process_connector.png",
							action: function(id, data){
								// ModeConnectedActivityAdd.on('connector', data.connectorId, data.port);
								console.log('ModeConnectedActivityAdd.on("connector", '+data.connectorId+', '+data.port+')');
							}
						});
						subActions.push({
							label: "Link to",
							icon: img_url + "go-jump.png",
							action: function(id, data, e){
								// ModeArrowLink.on(data.connectorId, data.port);
								
								canvasPosition = $(ActivityDiagramClass.canvas).offset();
								console.log('canvasPosition', canvasPosition);
								console.log('e.pageX', e.pageX);
								console.log('e.e.pageY', e.pageY);
								//real offset need to be calculated:
								position = {left:e.pageX-canvasPosition.left, top:e.pageY-canvasPosition.top};
								ModeArrowLink.on(data.connectorId, data.port, position);
							}
						});
						
						
						//get connectorId and port out of arrowId:
						var submenuConnectorId = '';
						var submenuPort = '';
						var indexConnector = data.arrowId.indexOf('connector_');
						var indexPort = data.arrowId.indexOf('_pos_bottom_port_');
						if(indexConnector==0 && indexPort){
							submenuConnectorId = data.arrowId.substring(10,indexPort);
							submenuPort = data.arrowId.substr(indexPort+17);
						}else{
							throw 'wrong format of arrow id';
							return false
						}
						
						ModeActivityMenu.createMenu(
							data.selfId,
							data.selfId,
							'bottom',
							subActions,
							{offset:10, data:{connectorId: submenuConnectorId, port:submenuPort}}
						);
						ModeActivityMenu.existingMenu[topContainerId] = connectId;
						
					}
					
				}
			}],
			{offset:10, autoclose:false, data:{arrowId:pointId, topMenuId:topContainerId, menuContainerId: pointId}}
		);
		ModeActivityMenu.existingMenu[pointId] = connectorId;
	}
	
}


ModeActivityMenu.createMenu = function(targetId, containerId, position, actions, options){
	
	//container = activity or connector:
	var container = $('#'+containerId);
	if(!container.length){
		throw 'no such container element in the DOM';
	}
	
	//think about destroying old menu:
	
	//set default options value:
	var offset = 20;
	var autoclose = true;
	var data = [];
	if(options){
		// console.log('options of the menu for '+containerId, options);
		if(options.offset != null){
			offset = options.offset;
		}
		if(options.autoclose != null){
			autoclose = options.autoclose;
		}
		if(options.data != null){
			data = options.data;
		}
	}
	
	var menuId = containerId+'_menu';
	var menuContainerId = menuId+'_container';
	//record the id of newly created menu, useful to build submenu
	data.selfId = menuContainerId;
	
	var menuContainer = $('<div id="'+menuContainerId+'"/>');
	var calculatedWith = (10+5+16+5)*parseInt(actions.length);
	var calculatedHeight = (3+16+3);
	menuContainer.width(calculatedWith+"px");
	menuContainer.height(calculatedHeight+"px");
	menuContainer.css('z-index',1001);//always on top
	menuContainer.css('position','absolute');
	menuContainer.appendTo(container);
	
	//position the menu with respect to the container:
	//correct offset value, due to absolute positionning... TODO redo that;
	switch(position){
		case 'top':{
			menuContainer.position({
				my: "center bottom",
				at: "center top",
				of: '#'+containerId,
				offset: "0 -"+offset
			});
			break;
		}
		case 'bottom':{
			menuContainer.position({
				my: "center top",
				at: "center bottom",
				of: '#'+containerId,
				offset: "0 "+offset
			});
			break;
		}
		case 'left':{
			menuContainer.position({
				my: "right center",
				at: "left center",
				of: '#'+containerId,
				offset: "-"+offset+" 0"
			});
			break;
		}
		case 'right':{
			menuContainer.position({
				my: "left center",
				at: "right center",
				of: '#'+containerId,
				offset: offset+" 0"
			});
			break;
		}
		default:{
			//destroy all and return error:
			// menu.remove();
			return false
		}
	}
	
	var menu = $('<ul id="'+menuId+'"/>').appendTo(menuContainer);
	menu.addClass('activity_menu_horizontal');
	
	for(var i=0; i<actions.length; i++){
		var action = actions[i];
		
		if(targetId && action.label && action.icon && action.action){
			
			var anchorId = menuId+'_action_'+i;
			var anchor = $('<a id="'+anchorId+'"/>').appendTo($('<li/>').appendTo(menu));
			anchor.attr('title', action.label);
			anchor.attr('rel', targetId);
			anchor.append('<ins style="background-image: url(\''+action.icon+'\');">&nbsp;</ins>');
			
			initialAutoclose = autoclose;
			if(action.autoclose!=null){
				autoclose = action.autoclose;//if the autoclose option is set, overwrite the value
			}
			// console.log('i:',i);
			// console.log('action',action);
			// console.log('autoclose',autoclose);
			anchor.bind('click', {id:targetId, action:action.action, autoclose: autoclose, data:data}, function(event){
				event.preventDefault();
				event.stopPropagation();
				if(event.data.autoclose){
					ModeActivityMenu.cancel();
				}
				event.data.action(event.data.id, event.data.data, event);
			});
			autoclose = initialAutoclose;//restore intial value, useful only when action.autoclose is set
		}
	}
	
	return true;
}

ModeActivityMenu.removeMenu = function(containerId){
	if(containerId){
		var menuId = containerId+'_menu';
		var menuContainerId = menuId+'_container';
		if($('#'+menuContainerId).length){
			$('#'+menuContainerId).remove();
		}
		
	}
}

ModeActivityMenu.removeAllMenu = function(){
	// console.log('menus to delete', ModeActivityMenu.existingMenu);
	if(ModeActivityMenu.existingMenu){
		for(containerId in ModeActivityMenu.existingMenu){
			ModeActivityMenu.removeMenu(containerId);
			delete ModeActivityMenu.existingMenu[containerId];
		}
	}
}

ModeActivityMenu.cancel = function(){
	//delete old menu
	ModeActivityMenu.removeAllMenu();
	// ActivityDiagramClass.unsetFeedbackMenu();//no longer required
}
