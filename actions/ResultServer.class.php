<?php
require_once('tao/actions/CommonModule.class.php');
require_once('tao/actions/TaoModule.class.php');
// require_once(BASE_PATH.'/models/classes/class.CampaignService.php');

/**
 * ResultServer Controller provide actions performed from url resolution
 * 
 * @author CRP Henri Tudor - TAO Team - {@link http://www.tao.lu}
 * @package taoDelivery
 * @subpackage actions
 * @license GPLv2  http://www.opensource.org/licenses/gpl-2.0.php
 */
 
class ResultServer extends TaoModule {
	
	/**
	 * constructor: initialize the service and the default data
	 * @return Delivery
	 */
	public function __construct(){
		
		parent::__construct();
		
		//the service is initialized by default
		$this->service = new taoDelivery_models_classes_resultServerService();
		$this->defaultData();
		
		Session::setAttribute('currentSection', 'result_server');
	}
	
/*
 * conveniance methods
 */
	
	/**
	 * get the selected resultServer from the current context (from the uri and classUri parameter in the request)
	 * @return core_kernel_classes_Resource $resultServer
	 */
	private function getCurrentResultServer(){
		$uri = tao_helpers_Uri::decode($this->getRequestParameter('uri'));
		if(is_null($uri) || empty($uri)){
			throw new Exception("No valid uri found");
		}
		
		$clazz = $this->getCurrentClass();
		
		$resultServer = $this->service->getResultServer($uri, 'uri', $clazz);
		if(is_null($resultServer)){
			throw new Exception("No resultServer found for the uri {$uri}");
		}
		
		return $resultServer;
	}
	
/*
 * controller actions
 */
	/**
	 * Render json data to populate the result servers tree 
	 * 'modelType' must be in the request parameters
	 * @return void
	 */
	public function getResultServers(){
		
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		$highlightUri = '';
		if($this->hasSessionAttribute("showNodeUri")){
			$highlightUri = $this->getSessionAttribute("showNodeUri");
			unset($_SESSION[SESSION_NAMESPACE]["showNodeUri"]);
		} 
		$filter = '';
		if($this->hasRequestParameter('filter')){
			$filter = $this->getRequestParameter('filter');
		}
		
		echo json_encode( $this->service->toTree( $this->service->getResultServerClass(), true, true, $highlightUri, $filter));
	}
	
	/**
	 * Edit a resultServer class
	 * @see tao_helpers_form_GenerisFormFactory::classEditor
	 * @return void
	 */
	public function editResultServerClass(){
		$clazz = $this->getCurrentClass();
		$myForm = $this->editClass($clazz, $this->service->getResultServerClass());
		if($myForm->isSubmited()){
			if($myForm->isValid()){
				if($clazz instanceof core_kernel_classes_Resource){
					$this->setSessionAttribute("showNodeUri", tao_helpers_Uri::encode($clazz->uriResource));
				}
				$this->setData('message', 'resultServer class saved');
				$this->setData('reload', true);
				$this->forward('ResultServer', 'index');
			}
		}
		$this->setData('formTitle', 'Edit resultServer class');
		$this->setData('myForm', $myForm->render());
		$this->setView('form.tpl');
	}
	
	/**
	 * Edit a delviery instance
	 * @see tao_helpers_form_GenerisFormFactory::instanceEditor
	 * @return void
	 */
	public function editResultServer(){
		$clazz = $this->getCurrentClass();
		
		$resultServer = $this->getCurrentResultServer();
		$myForm = tao_helpers_form_GenerisFormFactory::instanceEditor($clazz, $resultServer);
		if($myForm->isSubmited()){
			if($myForm->isValid()){
				
				$resultServer = $this->service->bindProperties($resultServer, $myForm->getValues());
				
				$this->setSessionAttribute("showNodeUri", tao_helpers_Uri::encode($resultServer->uriResource));
				$this->setData('message', 'result server saved');
				$this->setData('reload', true);
				$this->forward('resultServer', 'index');
			}
		}
		
		//get the deliveries related to this delivery resultServer
		$relatedDeliveries = $this->service->getRelatedDeliveries($resultServer);
		$relatedDeliveries = array_map("tao_helpers_Uri::encode", $relatedDeliveries);
		$this->setData('relatedDeliveries', json_encode($relatedDeliveries));
		
		
		
		$this->setData('formTitle', 'Edit ResultServer');
		$this->setData('myForm', $myForm->render());
		$this->setView('form_resultserver.tpl');
	}
	
	/**
	 * Add a resultServer instance        
	 * @return void
	 */
	public function addResultServer(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		$clazz = $this->getCurrentClass();
		$resultServer = $this->service->createInstance($clazz);
		if(!is_null($resultServer) && $resultServer instanceof core_kernel_classes_Resource){
			echo json_encode(array(
				'label'	=> $resultServer->getLabel(),
				'uri' 	=> tao_helpers_Uri::encode($resultServer->uriResource)
			));
		}
	}
	
	/**
	 * Add a resultServer subclass
	 * @return void
	 */
	public function addResultServerClass(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		$clazz = $this->service->createResultServerClass($this->getCurrentClass());
		if(!is_null($clazz) && $clazz instanceof core_kernel_classes_Class){
			echo json_encode(array(
				'label'	=> $clazz->getLabel(),
				'uri' 	=> tao_helpers_Uri::encode($clazz->uriResource)
			));
		}
	}
	
	/**
	 * Delete a resultServer or a resultServer class
	 * @return void
	 */
	public function delete(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		
		$deleted = false;
		if($this->getRequestParameter('uri')){
			$deleted = $this->service->deleteResultServer($this->getCurrentResultServer());
		}
		else{
			$deleted = $this->service->deleteResultServerClass($this->getCurrentClass());
		}
		
		echo json_encode(array('deleted'	=> $deleted));
	}
	
	/**
	 * Duplicate a resultServer instance
	 * @return void
	 */
	public function cloneResultServer(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		
		$resultServer = $this->getCurrentResultServer();
		$clazz = $this->getCurrentClass();
		
		$clone = $this->service->createInstance($clazz);
		if(!is_null($clone)){
			
			foreach($clazz->getProperties() as $property){
				foreach($resultServer->getPropertyValues($property) as $propertyValue){
					$clone->setPropertyValue($property, $propertyValue);
				}
			}
			$clone->setLabel($resultServer->getLabel()."'");
			echo json_encode(array(
				'label'	=> $clone->getLabel(),
				'uri' 	=> tao_helpers_Uri::encode($clone->uriResource)
			));
		}
	}
	
	/**
	 * Get the data to populate the tree of deliveries
	 * @return void
	 */
	public function getDeliveries(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		
		echo json_encode($this->service->toTree( new core_kernel_classes_Class(TAO_DELIVERY_CLASS), true, true, ''));
	}
	
	/**
	 * Save the related deliveries
	 * @return void
	 */
	public function saveDeliveries(){
		if(!tao_helpers_Request::isAjax()){
			throw new Exception("wrong request mode");
		}
		$saved = false;
		
		$deliveries = array();
			
		foreach($this->getRequestParameters() as $key => $value){
			if(preg_match("/^instance_/", $key)){
				array_push($deliveries, tao_helpers_Uri::decode($value));
			}
		}
		
		if($this->service->setRelatedDeliveries($this->getCurrentResultServer(), $deliveries)){
			$saved = true;
		}
		echo json_encode(array('saved'	=> $saved));
	}
	
	/**
	 * Main action
	 *
	 * @access public
     * @author CRP Henri Tudor - TAO Team - {@link http://www.tao.lu}
	 * @return void
	 */
	public function index(){
		
		if($this->getData('reload') == true){
			unset($_SESSION[SESSION_NAMESPACE]['uri']);
			unset($_SESSION[SESSION_NAMESPACE]['classUri']);
		}
		$this->setView('index_resultserver.tpl');
	}
		
	
	/*
	 * @TODO implement the following actions
	 */
	
	public function getMetaData(){
		throw new Exception("Not implemented yet");
	}
	
	public function saveComment(){
		throw new Exception("Not implemented yet");
	}
		
}
?>