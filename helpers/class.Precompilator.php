<?php

error_reporting(E_ALL);

if (0 > version_compare(PHP_VERSION, '5')) {
    die('This file was generated for PHP 5');
}

/**
 * @author CRP Henri Tudor - TAO Team - {@link http://www.tao.lu}
 * @license GPLv2  http://www.opensource.org/licenses/gpl-2.0.php
 *
 */
class tao_helpers_Precompilator
{
    // --- ASSOCIATIONS ---

    // --- ATTRIBUTES ---
	protected $completed = array();
	
	protected $failed = array();
	
	protected $pluginPath = "";
	
	public $compiledPath= "";
	
	protected $testUri = "";
	
    // --- OPERATIONS ---
	
	public function __construct($testUri, $compiledPath, $pluginPath){
		$this->completed=array(
					"copiedFiles"=>array(),
					"createdFiles"=>array()
					);
					
		$this->failed=array(
					"copiedFiles"=>array(),
					"createdFiles"=>array()
					);
		
		//create a directory where all files related to this test(i.e media files and item xml files) will be copied:
		$testId=self::getUniqueId($testUri);//get the an unique id for the test to be compiled
		$directory="$compiledPath$testId/";		
		if(!is_dir($compiledPath)){
			$this->failed["createdFiles"]["compiled_test_folder"]=$directory;
			throw new Exception("The main compiled test directory '$compiledPath' does not exist");
		}else{
			if(!is_dir($directory)){
				$created=mkdir($directory);
				if($created===false){
					$this->failed["createdFiles"]["compiled_test_folder"]=$directory;
					throw new Exception("The compiled test directory '$directory' does not exist and can not be created");
				}else{
					$this->completed["createdFiles"][]=$directory;
				}
			}
		}
		
		if(!is_dir($pluginPath)){
			throw new Exception("The plugin directory $pluginPath does not exist");
		}
		
		$this->compiledPath = $directory;
		$this->pluginPath = $pluginPath;
	}
	
	//return the "name.extension" of the copied or downloaded file. If it failsm it returns an empty string 
	public function copyFile($url,$directory,$affectedObject){
	
		$returnValue = "";
		
		$fileContent = @file_get_contents($url);
		if ($fileContent === false){
			$this->failed["copiedFiles"][$affectedObject][]=$url;
			return $returnValue;
		};
		
		//use of reverseUrl to get the last position of "/" and thus the fileName
		$reverseUrl = strrev($url);
		$reverseUrl = substr($reverseUrl,0,strpos($reverseUrl,"/"));
		$fileName = strrev($reverseUrl);
		
		$finalFilePath = $directory."/".$fileName;
		
		//check whether the file has been already downloaded: applicable for case when an item existing in several languages share the same multimedia file
		$isDownloaded=false;
		foreach ($this->completed["copiedFiles"] as $copiedFiles){
			//Check if it has not been downloaded yet
			if(in_array($url, $copiedFiles)) {
				$isDownloaded=true;
				break;
			}
		}
		if($isDownloaded===false){
			$handle = fopen($finalFilePath,"wb");
			$fileContent = fwrite($handle,$fileContent);
			fclose($handle);
			
			//record in the property "completed" that the file has been successfullly downloaded 
			$this->completed["copiedFiles"][$affectedObject][]=$url;//serait bien de faire: $this->completed["file"][$itemUri]=$url; pour connaitre la l'item impact� (par contre, definir la langue pas pr�vu)
		}
				
		return $returnValue = $fileName;
	}
    
	public function copyPlugins(){
		$affectedObject='';
		$plugins=array(
			'bar.swf',
			'CLLPlugin.swf',
			'countdown.swf',
			'ctest_item.swf',
			'kohs_passation.swf',
			'listen.swf',
			'tao_item.swf',
			'taotab.swf',
			'Test.swf',
			'upload_result.swf',
			'start.html',
			'theTest.php',
			'uploadItem.xml'
			);
		
		$jsFiles=array(
			'elements.js',
			'init.js',
			'jquery.js',
			'swfobject.js'
			);
			
		foreach($plugins as $plugin){
			$this->copyFile($this->pluginPath.$plugin, $this->compiledPath, 'delivery_runtime');
		}
		
		if(!is_dir($this->compiledPath."js/")){
			mkdir($this->compiledPath."js/");
		}	
		foreach($jsFiles as $jsFile){
			$this->copyFile($this->pluginPath."js/".$jsFile, $this->compiledPath."js/", 'delivery_runtime/js');
		}

		$cssFiles=array(
			'test_layout.css'
			);
		if(!is_dir($this->compiledPath."css/")){
			mkdir($this->compiledPath."css/");
		}	
		foreach($cssFiles as $cssFile){
			$this->copyFile($this->pluginPath."css/".$cssFile, $this->compiledPath."css/", 'delivery_runtime/css');
		}
	}
	
	public function itemParser($xml, $directory, $itemName, $authorizedMedia=array()){
		
		if(!file_exists($directory)){
			throw new Exception("the specified directory does not exist");
		}
		
		$defaultMedia = array("jpg","jpeg","png","gif","mp3","swf");
		
		$authorizedMedia = array_merge($defaultMedia,$authorizedMedia);
		$authorizedMedia = array_unique($authorizedMedia);//eliminate duplicate
		
		$mediaList = array();
		$exprArray = array();
		foreach ($authorizedMedia as $mediaType){
			$mediaListTemp=array();
			$expr="/http:\/\/[^<'\" ]+.".$mediaType."/i";//TODO: to be optimized by only searching tags that could contain media.
			preg_match_all($expr,$xml,$mediaListTemp);
			$mediaList = array_merge($mediaList,$mediaListTemp);
		}
					
		$uniqueMediaList = 	array_unique($mediaList[0]);	
		foreach($uniqueMediaList as $mediaUrl){
			$mediaPath = $this->copyFile($mediaUrl, $directory, $itemName);
			$xml = str_replace($mediaUrl,$mediaPath,$xml);
		}
		return $xml;
	}
	
	public function stringToFile($content, $directory, $fileName){
		if(!is_dir($directory)){
			$created=mkdir($directory);
			if($created===false){
				$this->failed["createdFiles"][$directory]=$fileName;
				throw new Exception("The folder $directory does not exist and can not be created");
			}
		}
		$handle = fopen("$directory/$fileName","wb");
		$content = fwrite($handle,$content);
		fclose($handle);
		$this->completed["createdFiles"][]=$fileName;
	}
	
	public function result(){
		$returnValue=array("completed"=>$this->completed, "failed"=>$this->failed);
		return $returnValue;
	}
	
	// public function createDirectory($directory){
		// if(!is_dir($directory)){
			// $created=mkdir($directory);
			// if($created===false){
				// $this->failed["createdFiles"][$directory]=$fileName;
				// throw new Exception("The folder $directory does not exist and can not be created");
			// }
		// }
	// }
	
	public function getUniqueId($uriRessource){
		$returnValue='';
		//TODO check format of the uri, preg_match()
		
		$returnValue=substr($uriRessource,stripos($uriRessource,".rdf#")+5);
		
		return $returnValue;
	}
	
} /* end of class taoDelivery_helpers_Precompilator */

?>