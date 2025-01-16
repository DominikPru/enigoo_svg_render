import React, { useContext } from "react";
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
import { Dimensions } from "react-native";
import DrawablePlace from "../src/containers/DrawablePlace";
import {
  ResizeContext,
  ResizeContextType,
} from "../src/provider/ResizeProvider";

const DEVICE_WIDTH = Dimensions.get("window").width;
const DEVICE_HEIGHT = Dimensions.get("window").height;

const StadionZoom = () => {
  const { viewBox } = useContext(ResizeContext) as ResizeContextType;
  const initialZoom = Math.min(
    DEVICE_WIDTH / viewBox.width,
    DEVICE_HEIGHT / viewBox.height
  );

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(initialZoom * 0.8); // Start slightly zoomed in

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Used to delay pan gesture activation
  const zoomDelay = useSharedValue(0);

  const ANIMATION_CONFIG = {
    damping: 30, // Spring damping
    stiffness: 100 * scale.value, // Movement speed
  };

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      zoomDelay.value = 0; // Reset the delay before zooming starts
      // Lock the focal point to the initial position
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      let newScale = scale.value * event.scale;

      // Detect if the user is zooming out (scale decreasing)
      // Clamp the scale value between the initial zoom and the max zoom (e.g., 2x)
      newScale = Math.max(initialZoom * 0.8, Math.min(newScale, 1.1));

      // Update the scale smoothly using spring animation
      scale.value = withSpring(newScale, ANIMATION_CONFIG, (isFinished) => {
        if (isFinished && scale.value < initialZoom * 0.9) {
          // If zooming out, reset the scale, translateX, and translateY
          scale.value = withSpring(initialZoom * 0.8, ANIMATION_CONFIG); // Smooth scale reset
          translateX.value = withSpring(0, ANIMATION_CONFIG); // Smooth translateX reset
          translateY.value = withSpring(0, ANIMATION_CONFIG); // Smooth translateY reset
        }
      });
      // Adjust translations to maintain focus on the locked focal point
      const scaleFactor = newScale / scale.value;

      // Use locked focal point for translation adjustment
      translateX.value = withSpring(
        translateX.value +
          (focalX.value - DEVICE_WIDTH / 2) * (scaleFactor - 1) * 0.1,
        ANIMATION_CONFIG
      );
      translateY.value = withSpring(
        translateY.value +
          (focalY.value - DEVICE_HEIGHT / 2) * (scaleFactor - 1) * 0.1,
        ANIMATION_CONFIG
      );
    })
    .onEnd(() => {
      // Animate the delay flag to control pan gesture activation
      zoomDelay.value = withTiming(1, { duration: 100 }); // Add a 100ms delay for pan gesture to activate
    });

  // Pan gesture for panning
  const panGesture = Gesture.Pan().onUpdate((event) => {
    if (scale.value > initialZoom && zoomDelay.value === 1) {
      // Calculate max translations for clamping based on the current scale
      const maxTranslateX = (viewBox.width * scale.value - DEVICE_WIDTH) / 2;
      const maxTranslateY = (viewBox.height * scale.value - DEVICE_HEIGHT) / 2;

      // Clamp the pan position to avoid moving the image out of bounds
      translateX.value = withSpring(
        Math.max(
          Math.min(translateX.value + event.translationX, maxTranslateX + 500),
          -maxTranslateX - 500 // This ensures you can't scroll past the left or right bounds
        ),
        ANIMATION_CONFIG
      );
      translateY.value = withSpring(
        Math.max(
          Math.min(translateY.value + event.translationY, maxTranslateY + 500),
          -maxTranslateY - 500 // This ensures you can't scroll past the top or bottom bounds
        ),
        ANIMATION_CONFIG
      );
    }
  });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style for transformation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value }, // Animated scale
        { translateX: translateX.value }, // Animated translation X
        { translateY: translateY.value }, // Animated translation Y
      ],
    };
  });

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            animatedStyle,
            {
              width: DEVICE_WIDTH,
              height: DEVICE_HEIGHT,
            },
          ]}
        >
          <DrawablePlace />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default StadionZoom;
