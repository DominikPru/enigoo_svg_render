import React, { useState } from "react";
import ResizeProvider from "./provider/ResizeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import StadionZoom from "./StadionZoom";
import { BaseInput, MapInfo } from "./types";

const EnigooSvgRender = ({ initialScale = 3, stadionData, loadCallback, zoomInComponent, zoomOutComponent, centerComponent, renderType }) => {

  return (
    <GestureHandlerRootView>
      <ResizeProvider initialScale={initialScale} data={stadionData} loadCallback={loadCallback} renderType={renderType}>
        <StadionZoom ZoomInComponent={zoomInComponent && zoomInComponent} ZoomOutComponent={zoomOutComponent && zoomOutComponent} CenterComponent={centerComponent && centerComponent} />
      </ResizeProvider>
    </GestureHandlerRootView>
  );
};

export default EnigooSvgRender;
