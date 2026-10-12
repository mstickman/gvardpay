import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { ICONS } from '../../constants/icons';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 96;
const BLUE = '#4C7EFF';

interface LoadingAnimationProps {
  onFinish: () => void;
  /** Что показать в кружке. По умолчанию — логотип (ICONS.logo). */
  icon?: ImageSourcePropType;
  /** Подпись с названием приложения под кружком. */
  showName?: boolean;
}

/**
 * Синий полноэкранный блок сжимается в кружок нужного диаметра, затем
 * внутри проявляется иконка. При запуске приложения это логотип
 * (assets/icons/logo.png), после создания кошелька — своя иконка
 * (assets/icons/wallet-created.png). Менять картинку не нужно в коде —
 * достаточно положить файл с тем же именем.
 */
export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onFinish,
  icon = ICONS.logo,
  showName = true,
}) => {
  const size = useSharedValue(Math.max(width, height) * 1.6);
  const radius = useSharedValue(0);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    size.value = withSequence(
      withTiming(size.value, { duration: 0 }),
      withTiming(CIRCLE_SIZE, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
    radius.value = withTiming(CIRCLE_SIZE / 2, { duration: 550, easing: Easing.out(Easing.cubic) });
    iconOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }),
    );
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    width: size.value,
    height: size.value,
    borderRadius: radius.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.View style={iconStyle}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
      {showName && (
        <Animated.Text style={[styles.name, iconStyle]}>GvardPay</Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0B0D',
    zIndex: 999,
  },
  circle: {
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: 52,
    height: 52,
  },
  name: {
    position: 'absolute',
    top: height / 2 + CIRCLE_SIZE / 2 + 18,
    color: '#F5F6F7',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
