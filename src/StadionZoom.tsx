import React, { useContext, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import { ResizeContext, ResizeContextType } from "./provider/ResizeProvider";
import { renderTypes } from "../src/types";
import DrawablePlace from "./containers/DrawablePlace";
import CategoriesHeader from "../src/components/CategoriesHeader";

// Types
interface StadionZoomProps {
  ZoomInComponent?: React.ComponentType;
  ZoomOutComponent?: React.ComponentType;
  CenterComponent?: React.ComponentType;
  controlsContainerStyle?: object;
}

interface ContainerDimensions {
  width: number;
  height: number;
}

const StadionZoom: React.FC<StadionZoomProps> = ({
  ZoomInComponent,
  ZoomOutComponent,
  CenterComponent,
  controlsContainerStyle,
}) => {
  // Context and state
  const { viewBox, resizeScale, renderType } = useContext(
    ResizeContext
  ) as ResizeContextType;
  const [containerDimensions, setContainerDimensions] =
    useState<ContainerDimensions>({ width: 0, height: 0 });
  const initialScaleSet = useRef(false);

  // Constants
  const ANIMATION_CONFIG = {
    damping: 25,
    stiffness: 80,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  } as const;

  const ZOOM_LIMITS = {
    MAX_SCALE: renderType === renderTypes.SECTOR ? 5.2 : 3.2,
    ZOOM_IN_FACTOR: 1.4,
    ZOOM_OUT_FACTOR: 0.8,
    CENTER_ZOOM_THRESHOLD: 1.2,
  } as const;

  const GESTURE_CONSTANTS = {
    MIN_VELOCITY: 50,
    SCALE_FACTOR: 0.6,
    ZOOM_DELAY_DURATION: 100,
  } as const;

  // Calculate initial zoom
  const getInitialZoom = () => {
    const baseZoom = Math.min(
      containerDimensions.width / viewBox.width,
      containerDimensions.height / viewBox.height
    );
    return renderType === renderTypes.SECTOR ? baseZoom : baseZoom * 0.8;
  };

  const initialZoom = getInitialZoom();
  const zoomValue = initialZoom;

  // Shared values for animations
  const animatedValues = {
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    scale: useSharedValue(1),
    focalX: useSharedValue(0),
    focalY: useSharedValue(0),
    zoomDelay: useSharedValue(1),
    lastOffsetX: useSharedValue(0),
    lastOffsetY: useSharedValue(0),
  };

  // Effects
  useEffect(() => {
    if (
      containerDimensions.width &&
      containerDimensions.height &&
      !initialScaleSet.current
    ) {
      animatedValues.scale.value = zoomValue;
      initialScaleSet.current = true;
    }
  }, [containerDimensions, viewBox]);

  // Worklet functions
  const handleCenterWorklet = () => {
    "worklet";
    animatedValues.scale.value = withSpring(zoomValue, ANIMATION_CONFIG);
    animatedValues.translateX.value = withSpring(0, ANIMATION_CONFIG);
    animatedValues.translateY.value = withSpring(0, ANIMATION_CONFIG);
  };

  const handleZoomWorklet = (increase: boolean) => {
    "worklet";
    const factor = increase
      ? ZOOM_LIMITS.ZOOM_IN_FACTOR
      : ZOOM_LIMITS.ZOOM_OUT_FACTOR;
    const limit = increase ? ZOOM_LIMITS.MAX_SCALE / resizeScale : zoomValue;
    const newScale = increase
      ? Math.min(animatedValues.scale.value * factor, limit)
      : Math.max(animatedValues.scale.value * factor, limit);

    if (
      increase === false &&
      animatedValues.scale.value <=
        initialZoom * ZOOM_LIMITS.CENTER_ZOOM_THRESHOLD
    ) {
      handleCenterWorklet();
    }

    animatedValues.scale.value = withSpring(newScale, ANIMATION_CONFIG);
  };

  // UI Thread handlers
  const handleZoom = (increase: boolean) => {
    handleZoomWorklet(increase);
  };

  const handleCenter = () => {
    handleCenterWorklet();
  };

  // Gesture handlers
  const createPinchGesture = () => {
    return Gesture.Pinch()
      .onStart((event) => {
        "worklet";
        animatedValues.zoomDelay.value = 0;
        animatedValues.focalX.value = event.focalX;
        animatedValues.focalY.value = event.focalY;
      })
      .onUpdate((event) => {
        "worklet";
        const newScale = Math.max(
          zoomValue,
          Math.min(
            animatedValues.scale.value * event.scale,
            ZOOM_LIMITS.MAX_SCALE / resizeScale
          )
        );

        animatedValues.scale.value = withSpring(
          newScale,
          ANIMATION_CONFIG,
          (isFinished) => {
            if (isFinished && animatedValues.scale.value < initialZoom) {
              handleCenterWorklet();
            }
          }
        );

        const scaleFactor = newScale / animatedValues.scale.value;
        const focalPointAdjustment = (point: number, dimension: number) =>
          (point - dimension / 2) *
          (scaleFactor - 1) *
          GESTURE_CONSTANTS.SCALE_FACTOR;

        animatedValues.translateX.value = withSpring(
          animatedValues.translateX.value -
            focalPointAdjustment(
              animatedValues.focalX.value,
              containerDimensions.width
            ),
          ANIMATION_CONFIG
        );
        animatedValues.translateY.value = withSpring(
          animatedValues.translateY.value -
            focalPointAdjustment(
              animatedValues.focalY.value,
              containerDimensions.height
            ),
          ANIMATION_CONFIG
        );

        animatedValues.lastOffsetX.value = animatedValues.translateX.value;
        animatedValues.lastOffsetY.value = animatedValues.translateY.value;
      })
      .onEnd(() => {
        "worklet";
        animatedValues.lastOffsetX.value = animatedValues.translateX.value;
        animatedValues.lastOffsetY.value = animatedValues.translateY.value;

        if (
          animatedValues.scale.value <
          initialZoom * ZOOM_LIMITS.CENTER_ZOOM_THRESHOLD
        ) {
          handleCenterWorklet();
        }

        animatedValues.zoomDelay.value = withTiming(1, {
          duration: GESTURE_CONSTANTS.ZOOM_DELAY_DURATION,
        });
      });
  };

  const createPanGesture = () => {
    return Gesture.Pan()
      .onStart(() => {
        "worklet";
        animatedValues.lastOffsetX.value = animatedValues.translateX.value;
        animatedValues.lastOffsetY.value = animatedValues.translateY.value;
      })
      .onUpdate((event) => {
        "worklet";
        if (
          animatedValues.scale.value > initialZoom &&
          animatedValues.zoomDelay.value === 1 &&
          (Math.abs(event.velocityX) > GESTURE_CONSTANTS.MIN_VELOCITY ||
            Math.abs(event.velocityY) > GESTURE_CONSTANTS.MIN_VELOCITY)
        ) {
          const scaledContentWidth = viewBox.width * animatedValues.scale.value;
          const scaledContentHeight =
            viewBox.height * animatedValues.scale.value;
          const overflowX = Math.max(
            0,
            scaledContentWidth * GESTURE_CONSTANTS.SCALE_FACTOR
          );
          const overflowY = Math.max(
            0,
            scaledContentHeight * GESTURE_CONSTANTS.SCALE_FACTOR
          );

          const nextX =
            animatedValues.lastOffsetX.value +
            event.translationX / animatedValues.scale.value;
          const nextY =
            animatedValues.lastOffsetY.value +
            event.translationY / animatedValues.scale.value;

          animatedValues.translateX.value = Math.max(
            Math.min(nextX, overflowX),
            -overflowX
          );
          animatedValues.translateY.value = Math.max(
            Math.min(nextY, overflowY),
            -overflowY
          );
        }
      })
      .onEnd(() => {
        "worklet";
        animatedValues.lastOffsetX.value = animatedValues.translateX.value;
        animatedValues.lastOffsetY.value = animatedValues.translateY.value;
      });
  };

  const composedGesture = Gesture.Simultaneous(
    createPanGesture(),
    createPinchGesture()
  );

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: animatedValues.scale.value },
      { translateX: animatedValues.translateX.value },
      { translateY: animatedValues.translateY.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerDimensions({ width, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              animatedStyle,
              {
                width: containerDimensions.width,
                height: containerDimensions.height,
              },
            ]}
          >
            <DrawablePlace containerDimensions={containerDimensions} />
          </Animated.View>
        </GestureDetector>

        <CategoriesHeader />

        <View
          style={[
            { position: "absolute", right: 16, top: 92 },
            controlsContainerStyle,
          ]}
        >
          {ZoomInComponent && (
            <TouchableOpacity
              onPress={() => handleZoom(true)}
              style={{ marginBottom: 8 }}
            >
              <ZoomInComponent />
            </TouchableOpacity>
          )}

          {ZoomOutComponent && (
            <TouchableOpacity
              onPress={() => handleZoom(false)}
              style={{ marginBottom: 8 }}
            >
              <ZoomOutComponent />
            </TouchableOpacity>
          )}

          {CenterComponent && (
            <TouchableOpacity onPress={handleCenter}>
              <CenterComponent />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

export default StadionZoom;
