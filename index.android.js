'use strict';

import {
  NativeModules,
  DeviceEventEmitter,
} from 'react-native';

const googleFit = NativeModules.RNGoogleFit;

class RNGoogleFit {
    eventListeners = []

    constants={
      dataTypes: {
        steps: 'STEP_RECORDING',
        distance: 'DISTANCE_RECORDING',
        weight: 'WEIGHT_RECORDING',
        height: 'HEIGHT_RECORDING',
      },
    }

    authorize() {
      googleFit.authorize();
    }

    removeListeners = () => {
      this.eventListeners.forEach(eventListener => eventListener.remove());
      this.eventListeners = [];
    }

    /**
     * Start recording fitness data
     * Pass a callback function, and optionally an array of data types (as in constants.dataTypes)
     * If dataTypes param does not exist, function will subscribe to all available data types.
     * TODO: Refactor to use Fitness.DataTypes
     */
    startRecording = (callback, dataTypes = []) => {
      const typesToSubscribe = dataTypes.length
        ? dataTypes
        : Object.values(this.constants.dataTypes);
      typesToSubscribe.forEach((dataType) => {
        this.startRecordingAddListenerForDataType(callback, dataType);
      });
    }

    /**
     * Start recording fitness data for one data type
     * This function relies on sending events to signal the RecordingAPI status
     * Simply create an event listener for the {DATA_TYPE}_RECORDING (ex. STEP_RECORDING)
     * and check for {recording: true} as the event data
     */
    startRecordingAddListenerForDataType(callback, dataType) {
      console.log('start rec and add listener ', dataType);
      googleFit.startFitnessRecording(dataType);
      const listenerForDataType = DeviceEventEmitter.addListener(
        dataType,
        value => callback({ ...value }),
      );
      this.eventListeners.push(listenerForDataType);
    }

    // Will be deprecated in future releases
    getSteps(dayStart, dayEnd) {
      googleFit.getDailySteps(Date.parse(dayStart), Date.parse(dayEnd));
    }

    // Will be deprecated in future releases
    getWeeklySteps(startDate) {
      googleFit.getWeeklySteps(Date.parse(startDate), Date.now());
    }


    /**
     * Get the total steps per day over a specified date range.
     * @param {Object} options getDailyStepCountSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @param {Function} callback The function will be called with an array of elements.
     */

    getDailyStepCountSamples = (options, callback) => {
      const startDate = options.startDate != undefined ? Date.parse(options.startDate) : (new Date()).setHours(0, 0, 0, 0);
      const endDate = options.endDate != undefined ? Date.parse(options.endDate) : (new Date()).valueOf();
      googleFit.getDailyStepCountSamples(startDate, endDate,
        msg => callback(msg, false),
        (res) => {
          if (res.length > 0) {
            callback(false, res.map(function (dev) {
              const obj = {};
              obj.source = dev.source.appPackage + ((dev.source.stream) ? `:${dev.source.stream}` : '');
              obj.steps = this.buildDailySteps(dev.steps);
              return obj;
            }, this));
          } else {
            callback('There is no any steps data for this period', false);
          }
        });
    }

    buildDailySteps(steps) {
      const results = {};
      for (const step of steps) {
        if (step == undefined) continue;

        const date = new Date(step.startDate);

        const day = (`0${date.getDate()}`).slice(-2);
        const month = (`0${date.getMonth() + 1}`).slice(-2);
        const year = date.getFullYear();
        const dateFormatted = `${year}-${month}-${day}`;

        if (!(dateFormatted in results)) {
          results[dateFormatted] = 0;
        }

        results[dateFormatted] += step.steps;
      }

      const dateMap = [];
      for (const index in results) {
        dateMap.push({ date: index, value: results[index] });
      }
      return dateMap;
    }

    /**
     * Get the total distance per day over a specified date range.
     * @param {Object} options getDailyDistanceSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getDailyDistanceSamples(options, callback) {
      const startDate = options.startDate != undefined ? Date.parse(options.startDate) : (new Date()).setHours(0, 0, 0, 0);
      const endDate = options.endDate != undefined ? Date.parse(options.endDate) : (new Date()).valueOf();
      googleFit.getDailyDistanceSamples(startDate,
        endDate,
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          if (res.length > 0) {
            res = res.map((el) => {
              if (el.distance) {
                el.startDate = new Date(el.startDate).toISOString();
                el.endDate = new Date(el.endDate).toISOString();
                return el;
              }
            });
            callback(false, res.filter(day => day != undefined));
          } else {
            callback('There is no any distance data for this period', false);
          }
        });
    }


    /**
     * Get the total calories per day over a specified date range.
     * @param {Object} options getDailyCalorieSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getDailyCalorieSamples(options, callback) {
      const startDate = Date.parse(options.startDate);
      const endDate = Date.parse(options.endDate);
      googleFit.getDailyCalorieSamples(
        startDate,
        endDate,
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          if (res.length > 0) {
            res = res.map((el) => {
              if (el.calorie) {
                el.startDate = new Date(el.startDate).toISOString();
                el.endDate = new Date(el.endDate).toISOString();
                return el;
              }
            });
            callback(false, res.filter(day => day != undefined));
          } else {
            callback('There is no any calorie data for this period', false);
          }
        },
      );
    }


    /**
     * Query for weight samples. the options object is used to setup a query to retrieve relevant samples.
     * @param {Object} options  getDailyStepCountSamples accepts an options object containing unit: "pound"/"kg",
     *                          startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getWeightSamples = (options, callback) => {
      const startDate = options.startDate != undefined ? Date.parse(options.startDate) : (new Date()).setHours(0, 0, 0, 0);
      const endDate = options.endDate != undefined ? Date.parse(options.endDate) : (new Date()).valueOf();
      googleFit.getWeightSamples(startDate,
        endDate,
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          if (res.length > 0) {
            res = res.map((el) => {
              if (el.value) {
                if (options.unit === 'pound') {
                  el.value = this.KgToLbs(el.value); // convert back to pounds
                }
                el.startDate = new Date(el.startDate).toISOString();
                el.endDate = new Date(el.endDate).toISOString();
                return el;
              }
            });
            callback(false, res.filter(day => day != undefined));
          } else {
            callback('There is no any weight data for this period', false);
          }
        });
    }

    saveWeight = (options, callback) => {
      if (options.unit === 'pound') {
        options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); // convert pounds and ounces to kg
      }
      options.date = Date.parse(options.date);
      googleFit.saveWeight(options,
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          callback(false, res);
        });
    }

    deleteWeight = (options, callback) => {
      if (options.unit === 'pound') {
        options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); // convert pounds and ounces to kg
      }
      options.date = Date.parse(options.date);
      googleFit.deleteWeight(options,
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          callback(false, res);
        });
    }

    isAvailable(callback) { // true if GoogleFit installed
      googleFit.isAvailable(
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          callback(false, res);
        },
      );
    }

    isEnabled(callback) { // true if permission granted
      googleFit.isEnabled(
        (msg) => {
          callback(msg, false);
        },
        (res) => {
          callback(false, res);
        },
      );
    }

    observeSteps = (callback) => {
      const stepsObserver = DeviceEventEmitter.addListener(
        'StepChangedEvent',
        steps => callback(steps),
      );
      googleFit.observeSteps();
      this.eventListeners.push(stepsObserver);
    }

    observeHistory = (callback) => {
      const historyObserver = DeviceEventEmitter.addListener(
        'StepHistoryChangedEvent',
        steps => callback(steps),
      );
      this.eventListeners.push(historyObserver);
    }

    onAuthorize = (callback) => {
      const authObserver = DeviceEventEmitter.addListener(
        'GoogleFitAuthorizeSuccess',
        authorized => callback(authorized),
      );
      this.eventListeners.push(authObserver);
    }

    onAuthorizeFailure = (callback) => {
      const authFailedObserver = DeviceEventEmitter.addListener(
        'GoogleFitAuthorizeFailure',
        authorized => callback(authorized),
      );
      this.eventListeners.push(authFailedObserver);
    }

    unsubscribeListeners = () => {
      this.removeListeners();
    }

    lbsAndOzToK(imperial) {
      const pounds = imperial.pounds + imperial.ounces / 16;
      return pounds * 0.45359237;
    }

    KgToLbs(metric) {
      return metric * 2.2046;
    }
}

export default new RNGoogleFit();
