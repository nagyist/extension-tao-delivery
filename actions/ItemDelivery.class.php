<?php 
require_once('tao/actions/Api.class.php');

/**
 * This class is a container to call TAO XHTML items.
 * 
 * It enables you to run this kind of item in the context of a TAO server
 * by initiliazing it (set the context varaibles) and by rendering it.   
 * 
 * @author CRP Henri Tudor - TAO Team - {@link http://www.tao.lu}
 * @package taoDelivery
 * @subpackage actions
 * @license GPLv2  http://www.opensource.org/licenses/gpl-2.0.php
 */
class ItemDelivery extends Api {
	
	/**
	 * @see ItemDelivery::runner
	 */
	public function index(){
		$this->forward(get_class($this), 'runner');
	}
	
	/**
	 * This action run an item during a delivery execution
	 * @return void
	 */
	public function runner(){
		
		if(Session::hasAttribute('processUri') && 
				$this->hasRequestParameter('itemUri') && 
				$this->hasRequestParameter('testUri') &&
				$this->hasRequestParameter('deliveryUri') ){
			
			$user = $this->userService->getCurrentUser();
			if(is_null($user)){
				throw new Exception(__('No user is logged in'));
			}
			
			$process	= new core_kernel_classes_Resource(tao_helpers_Uri::decode(Session::getAttribute('processUri')));
			$item 		= new core_kernel_classes_Resource(tao_helpers_Uri::decode($this->getRequestParameter('itemUri')));
			$test 		= new core_kernel_classes_Resource(tao_helpers_Uri::decode($this->getRequestParameter('testUri')));
			$delivery 	= new core_kernel_classes_Resource(tao_helpers_Uri::decode($this->getRequestParameter('deliveryUri')));
			
			$executionEnvironment = $this->createExecutionEnvironment($process, $item, $test, $delivery, $user);
			
			//retrieving of the compiled item content
			$compiledFolder = $this->getCompiledFolder($executionEnvironment);
			$compiled = $compiledFolder .'index.html';	

			if(!file_exists($compiled)){
				throw new Exception(__("Unable to load the compiled item content"));
			}
			
			//get the deployment parameters
			$deliveryService 	= tao_models_classes_ServiceFactory::get('taoDelivery_models_classes_DeliveryService');
			$resultServerService = tao_models_classes_ServiceFactory::get('taoDelivery_models_classes_ResultServerService');
			
			$resultServer = $deliveryService->getResultServer($delivery);
			if(is_null($resultServer)){
				$resultServer = new core_kernel_classes_Resource(TAO_DELIVERY_DEFAULT_RESULT_SERVER);
			}
			$deploymentParams = $resultServerService->getDelpoymentParameters($resultServer);
			
			
			// We inject the data directly in the item file
			try{
				$doc = new DOMDocument();
				$doc->loadHTMLFile($compiled);
				
				
				//initialization of the TAO API
				$varCode = 'var '.self::ENV_VAR_NAME.' = '.json_encode($executionEnvironment).';';
				$initAPICode = 'initManualDataSource('.self::ENV_VAR_NAME.');';
				if(isset($deploymentParams['save_result_url'])){
					$saveResult = json_encode(array(
						'url' 		=> $deploymentParams['save_result_url'], 
						'params'	=> array('token' => $executionEnvironment['token'])
					));
					$initAPICode .= "initPush($saveResult, null);";
				}
				
				//initialize the events logging
				$initEventCode = '';
				if(file_exists($compiledFolder .'events.xml')){
					$eventService = tao_models_classes_ServiceFactory::get("tao_models_classes_EventsService");
					$eventData =  json_encode($eventService->getEventList($compiledFolder .'events.xml'));
					$saveEvent = 'null';
					if(isset($deploymentParams['save_event_url'])){
						$saveEvent = json_encode(array(
							'url' 		=> $deploymentParams['save_event_url'], 
							'params'	=> array('token' => $executionEnvironment['token'])
						));
					}
					$initEventCode = "initEventServices({ type: 'manual', data: $eventData}, $saveEvent);";
				}
				
				$clientCode  = '$(document).ready(function(){ '; 
				$clientCode .= "$varCode \n";
				$clientCode .= "$initAPICode \n";
				$clientCode .= "$initEventCode \n";
				$clientCode .= '});';
				$scriptElt   = $doc->createElement('script', $clientCode);
				$scriptElt->setAttribute('type', 'text/javascript');
				
				$headNodes = $doc->getElementsByTagName('head');
				
				foreach($headNodes as $headNode){
					$inserted = false;
					$scriptNodes = $headNode->getElementsByTagName('script');
					if($scriptNodes->length > 0){
						foreach($scriptNodes as $index => $scriptNode){
							if($scriptNode->hasAttribute('src')){
								if(preg_match("/taoApi\.min\.js$/", $scriptNode->getAttribute('src'))){
									$headNode->insertBefore($scriptElt, $scriptNodes->item($index +1));
									$inserted = true;
									break;
								}
							}
						}
					}
					if(!$inserted){
						$taoScriptElt = $doc->createElement('script');
						$taoScriptElt->setAttribute('type', 'text/javascript');
						$taoScriptElt->setAttribute('src', TAO_BASE_WWW.'js/taoApi/taoApi.min.js');
						$headNode->appendChild($taoScriptElt);
						
						$headNode->appendChild($scriptElt);
					}
					break;
				}
				
				//render the item
				echo $doc->saveHTML();
				
			}
			catch(DOMException $de){
				if(DEBUG_MODE){
					throw new Exception(__("An error occured while loading the item: ") . $de);
				}
				else{
					error_log($de->getMessage);		//log the error in the log file and display a common message
					throw new Exception(__("An error occured while loading the item"));
				}
			}
		}
	}
	
}
?>