/**
 * Copyright (c) 2017-present, Stanislav Doskalenko - doskalenko.s@gmail.com
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on Asim Malik android source code, copyright (c) 2015
 *
 **/

package com.reactnative.googlefit;

import com.reactnative.googlefit.GoogleFitManager;

import com.facebook.react.bridge.ReactContext;
import android.util.Log;

import com.google.android.gms.fitness.Fitness;
import com.google.android.gms.fitness.FitnessStatusCodes;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.fitness.data.DataType;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import com.google.android.gms.fitness.result.ListSubscriptionsResult;
import com.google.android.gms.fitness.data.Subscription;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.support.annotation.Nullable;


public class RecordingApi {

    private ReactContext reactContext;
    private GoogleFitManager googleFitManager;

    private static final String TAG = "RecordingApi";

    public RecordingApi (ReactContext reactContext, GoogleFitManager googleFitManager) {
        this.reactContext = reactContext;
        this.googleFitManager = googleFitManager;
    }

    public void subscribe (String jsDataType) {

        Log.i(TAG,"Subscribe to " + jsDataType );
        if (jsDataType.equals("STEP_RECORDING")){
            subscribeToDataType(DataType.TYPE_STEP_COUNT_CUMULATIVE,jsDataType);
        } else if(jsDataType.equals("DISTANCE_RECORDING")){
            subscribeToDataType(DataType.TYPE_DISTANCE_DELTA,jsDataType);
        } else if(jsDataType.equals("WEIGHT_RECORDING")){
            subscribeToDataType(DataType.TYPE_WEIGHT,jsDataType);
        } else if(jsDataType.equals("HEIGHT_RECORDING")){
            subscribeToDataType(DataType.TYPE_HEIGHT,jsDataType);
        } else {
            return;
        }
    }

    private void subscribeToDataType(DataType googleFitDataType,final String jsDataType){
        Log.i(TAG,"sub"+ jsDataType);
        Fitness.RecordingApi.subscribe(googleFitManager.getGoogleApiClient(), googleFitDataType)
        .setResultCallback(new ResultCallback <Status> () {
            @Override
            public void onResult(Status status) {
                    WritableMap map = Arguments.createMap();
                    map.putString("type", jsDataType);
                    map.putBoolean("recording", status.isSuccess());
                    sendEvent(reactContext, jsDataType, map);
                }
            });
    }

    private void sendEvent(ReactContext reactContext,
        String eventName, @Nullable WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}