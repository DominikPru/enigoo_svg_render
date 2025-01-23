// StadionZoom.tsx
import React, { useContext, useEffect, useState } from "react";
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
import { Dimensions, View } from "react-native";
import DrawablePlace from "../src/containers/DrawablePlace";
import {
  ResizeContext,
  ResizeContextType,
} from "../src/provider/ResizeProvider";

const StadionZoom = () => {
  const { viewBox, resizeScale } = useContext(
    ResizeContext
  ) as ResizeContextType;
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Initialize shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const zoomDelay = useSharedValue(0);
  const lastOffsetX = useSharedValue(0);
  const lastOffsetY = useSharedValue(0);

  // Update scale when container dimensions change
  useEffect(() => {
    if (containerDimensions.width && containerDimensions.height) {
      const initialZoom = Math.min(
        containerDimensions.width / viewBox.width,
        containerDimensions.height / viewBox.height
      );
      scale.value = initialZoom * 0.8;
    }
  }, [containerDimensions, viewBox]);

  const ANIMATION_CONFIG = {
    damping: 25,
    stiffness: 80,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      zoomDelay.value = 0;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const initialZoom = Math.min(
        containerDimensions.width / viewBox.width,
        containerDimensions.height / viewBox.height
      );
      let newScale = scale.value * event.scale;
      newScale = Math.max(
        initialZoom * 0.8,
        Math.min(newScale, 3.3 / resizeScale)
      );

      scale.value = withSpring(newScale, ANIMATION_CONFIG, (isFinished) => {
        if (isFinished && scale.value < initialZoom) {
          scale.value = withSpring(initialZoom * 0.8, ANIMATION_CONFIG);
          translateX.value = withSpring(0, ANIMATION_CONFIG);
          translateY.value = withSpring(0, ANIMATION_CONFIG);
        }
      });

      const scaleFactor = newScale / scale.value;
      translateX.value = withSpring(
        translateX.value -
          (focalX.value - containerDimensions.width / 2) *
            (scaleFactor - 1) *
            0.6,
        ANIMATION_CONFIG
      );
      translateY.value = withSpring(
        translateY.value -
          (focalY.value - containerDimensions.height / 2) *
            (scaleFactor - 1) *
            0.6,
        ANIMATION_CONFIG
      );

      lastOffsetX.value = translateX.value;
      lastOffsetY.value = translateY.value;
    })
    .onEnd(() => {
      lastOffsetX.value = translateX.value;
      lastOffsetY.value = translateY.value;
      const initialZoom = Math.min(
        containerDimensions.width / viewBox.width,
        containerDimensions.height / viewBox.height
      );
      if (scale.value < initialZoom) {
        scale.value = withSpring(initialZoom * 0.8, ANIMATION_CONFIG);
        translateX.value = withSpring(0, ANIMATION_CONFIG);
        translateY.value = withSpring(0, ANIMATION_CONFIG);
      }
      zoomDelay.value = withTiming(1, { duration: 100 });
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      lastOffsetX.value = translateX.value;
      lastOffsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const initialZoom = Math.min(
        containerDimensions.width / viewBox.width,
        containerDimensions.height / viewBox.height
      );

      if (scale.value > initialZoom && zoomDelay.value === 1) {
        if (Math.abs(event.velocityX) > 50 || Math.abs(event.velocityY) > 50) {
          const scaledContentWidth = viewBox.width * scale.value;
          const scaledContentHeight = viewBox.height * scale.value;
          const overflowX = Math.max(0, scaledContentWidth * 0.6);
          const overflowY = Math.max(0, scaledContentHeight * 0.6);

          const nextX = lastOffsetX.value + event.translationX / scale.value;
          const nextY = lastOffsetY.value + event.translationY / scale.value;

          translateX.value = Math.max(Math.min(nextX, overflowX), -overflowX);
          translateY.value = Math.max(Math.min(nextY, overflowY), -overflowY);
        }
      }
    })
    .onEnd(() => {
      lastOffsetX.value = translateX.value;
      lastOffsetY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
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
      </View>
    </GestureHandlerRootView>
  );
};

export default StadionZoom;
