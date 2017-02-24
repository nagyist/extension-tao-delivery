<?php
/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA;
 *
 *
 */

namespace oat\taoDelivery\models\classes\execution;

use oat\oatbox\service\ServiceManager;
use oat\taoDelivery\model\execution\DeliveryExecution as DeliveryExecutionInterface;
use oat\taoDelivery\model\execution\StateServiceInterface;

class DeliveryExecution implements DeliveryExecutionInterface
{

    /**
     * @var \DeliveryExecutionInterface
     */
    private $implementation;

    public function __construct(DeliveryExecutionInterface $implementation)
    {
        $this->setImplementation($implementation);
    }

    public function setImplementation(DeliveryExecutionInterface $implementation) {
        $this->implementation = $implementation;
    }

    /**
     * @return DeliveryExecutionInterface
     */
    public function getImplementation() {
        return $this->implementation;
    }

    /**
     * Returns the identifier of the delivery execution
     *
     * @return string
     */
    public function getIdentifier()
    {
        return $this->getImplementation()->getIdentifier();
    }

    /**
     * Returns a human readable test representation of the delivery execution
     * Should respect the current user's language
     *
     * @return string
     */
    public function getLabel()
    {
        return $this->getImplementation()->getLabel();
    }

    /**
     * Returns when the delivery execution was started
     */
    public function getStartTime()
    {
        return $this->getImplementation()->getStartTime();
    }

    /**
     * Returns when the delivery execution was finished
     * or null if not yet finished
     */
    public function getFinishTime()
    {
        return $this->getImplementation()->getFinishTime();
    }

    /**
     * Returns the delivery execution state as resource
     */
    public function getState()
    {
        return $this->getImplementation()->getState();
    }

    /**
     *
     * @param string $state
     * @return boolean success
     */
    public function setState($state)
    {
        $stateService = ServiceManager::getServiceManager()->get(StateServiceInterface::SERVICE_ID);
        $result = $stateService->setState($this->getImplementation(), $state);
        return $result;
    }

    /**
     * Returns the delivery execution delivery as resource
     *
     * @return core_kernel_classes_Resource
     */
    public function getDelivery()
    {
        return $this->getImplementation()->getDelivery();
    }

    /**
     * Returns the delivery executions user identifier
     *
     * @return string
     */
    public function getUserIdentifier()
    {
        return $this->getImplementation()->getUserIdentifier();
    }

    /**
     * Calls the named method which is not a class method.
     * Do not call this method.
     * @param string $name the method name
     * @param array $parameters method parameters
     * @return mixed the method return value
     */
    public function __call($name, $parameters)
    {
        return call_user_func_array(array($this->getImplementation(), $name), $parameters);
    }
}
