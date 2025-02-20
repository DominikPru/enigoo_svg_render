import React from "react";
import ResizeProvider from "./provider/ResizeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import StadionZoom from "./StadionZoom";
import { BaseInput, Sector, renderTypes } from "./types";

interface EnigooSvgRenderProps {
  /** Initial scale value for the SVG render. Defaults to 3 */
  initialScale?: number;
  
  /** Data representing the stadium layout and configuration */
  stadionData: BaseInput;
  
  /** Callback function triggered after the stadium data is loaded */
  loadCallback?: () => void;
  
  /** Optional custom component for zoom in button */
  zoomInComponent?: React.ComponentType;
  
  /** Optional custom component for zoom out button */
  zoomOutComponent?: React.ComponentType;
  
  /** Optional custom component for center/reset button */
  centerComponent?: React.ComponentType;
  
  /** Type of render to be applied */
  renderType: renderTypes;
  
  /** Callback function triggered when a sector is selected/interacted with */
  sectorCallback?: (sector: Sector | undefined) => void;
}

const EnigooSvgRender = ({ initialScale = 3, stadionData, loadCallback, zoomInComponent, zoomOutComponent, centerComponent, renderType, sectorCallback } : EnigooSvgRenderProps) => {

  return (
    <GestureHandlerRootView>
      <ResizeProvider initialScale={initialScale} data={stadionData} loadCallback={loadCallback} sectorCallback={sectorCallback} renderType={renderType}>
        <StadionZoom ZoomInComponent={zoomInComponent && zoomInComponent} ZoomOutComponent={zoomOutComponent && zoomOutComponent} CenterComponent={centerComponent && centerComponent} />
      </ResizeProvider>
    </GestureHandlerRootView>
  );
};

export default EnigooSvgRender;
