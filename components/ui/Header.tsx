import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

const router = {
  back: () => console.log('Router back'),
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
}) => {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.right}>
          {rightAction}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A8FAD',
    fontSize: 13,
    marginTop: 2,
  },
});
