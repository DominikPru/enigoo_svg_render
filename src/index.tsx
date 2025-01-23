import React from "react";
import ResizeProvider from "./provider/ResizeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import StadionZoom from "./StadionZoom";
import { BaseInput, MapInfo } from "./types";

const EnigooSvgRender = ({ initialScale = 3, stadionData, loadCallback }) => {
  return (
    <GestureHandlerRootView>
      <ResizeProvider initialScale={initialScale} data={stadionData} loadCallback={loadCallback} >
        <StadionZoom />
      </ResizeProvider>
    </GestureHandlerRootView>
  );
};

export default EnigooSvgRender;
