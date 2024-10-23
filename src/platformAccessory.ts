import axios from 'axios';

import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import type { EnvironmentalMonitoringPlatform } from './platform.js';

interface SensorData {
  co2: number;
  co2Detected: boolean;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */

export class CarbonDioxideMonitorAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  constructor(
      private readonly platform: EnvironmentalMonitoringPlatform,
      private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.CarbonDioxideSensor) || this.accessory.addService(this.platform.Service.CarbonDioxideSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the Carbon Dioxide Level Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.CarbonDioxideLevel)
      .onGet(this.getCO2.bind(this)); // GET - bind to the `getCO2` method below

    this.service.getCharacteristic(this.platform.Characteristic.CarbonDioxideDetected)
      .onGet(this.getCO2Detected.bind(this));




    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same subtype id.)
     */

    // Example: add two "motion sensor" services to the accessory

    const carbonDioxideSensorOneService = this.accessory.getService(this.platform.Service.CarbonDioxideSensor);


    // const motionSensorOneService = this.accessory.getService('Motion Sensor One Name')
    //         || this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

    // const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name')
    //     || this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');

    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    let co2Detected = false;
    setInterval(() => {
      // EXAMPLE - inverse the trigger
      co2Detected = !co2Detected;
      // push the new value to HomeKit
      const url = this.platform.config.endpoint;
      let co2 = 0;
      try {
        const response = axios.get<SensorData>(url); // Use the generic type here
        const jsonData: SensorData = response.data; // Specify the type here

        // Process the JSON data directly in this function
        co2 = jsonData.co2;
        co2Detected = jsonData.co2Detected;
        this.platform.log.info(`Processing CO2 Level: ${co2}`);

        // Log the returned CO2 value
        this.platform.log.info(`CO2 Value Returned: ${co2}`);

        return co2; // Return the CO2 value if needed
      } catch (error) {
        this.platform.log.debug('Error making HTTP request: ->', co2);
        // this.log.error('Error making HTTP request:', error);
      }

      this.platform.log.debug('Fetching at Interval Get Characteristic CO2 ->', co2);
      carbonDioxideSensorOneService.updateCharacteristic(this.platform.Characteristic.CarbonDioxideDetected, co2Detected);
      carbonDioxideSensorOneService.updateCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, co2);

    }, 10000);
    // let co2Detected = false;
    // setInterval(() => {
    //   // EXAMPLE - inverse the trigger
    //   motionDetected = !motionDetected;
    //   // push the new value to HomeKit
    //   motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
    //   motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);
    //
    //   this.platform.log.debug('Triggering motionSensorOneService:', motionDetected);
    //   this.platform.log.debug('Triggering motionSensorTwoService:', !motionDetected);
    // }, 10000);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getCO2(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    // const co2 = 300;
    const url = this.platform.config.endpoint;
    let co2 = 0;
    try {
      const response = await axios.get<SensorData>(url); // Use the generic type here
      const jsonData: SensorData = response.data; // Specify the type here

      // Process the JSON data directly in this function
      co2 = jsonData.co2;
      this.platform.log.info(`Processing CO2 Level: ${co2}`);

      // Log the returned CO2 value
      this.platform.log.info(`CO2 Value Returned: ${co2}`);

      return co2; // Return the CO2 value if needed
    } catch (error) {
      this.platform.log.debug('Error making HTTP request: ->', co2);
      // this.log.error('Error making HTTP request:', error);
    }

    this.platform.log.debug('Get Characteristic CO2 ->', co2);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return co2;
  }

  async getCO2Detected(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    // const co2Detect = false;
    const url = this.platform.config.endpoint;
    let co2Detected = false;
    try {
      const response = await axios.get<SensorData>(url); // Use the generic type here
      const jsonData: SensorData = response.data; // Specify the type here

      // Process the JSON data directly in this function
      co2Detected = jsonData.co2Detected;
      this.platform.log.info(`Processing CO2 Detected: ${co2Detected}`);

      // Log the returned CO2 value
      this.platform.log.info(`CO2 Detected Returned: ${co2Detected}`);

      return co2Detected; // Return the CO2 value if needed
    } catch (error) {
      this.platform.log.debug('Error making HTTP request: ->', co2Detected);
      // this.log.error('Error making HTTP request:', error);
    }
    this.platform.log.debug('Characteristic CO2 Detected ->', co2Detected);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return co2Detected;
  }

}
