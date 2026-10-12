import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { BLOCKS, describeBlock } from '../../services/workflows/blocks';
import { WorkflowBlock } from '../../services/workflows/types';

export type BlockStatus = 'idle' | 'run' | 'ok' | 'fail';

interface Props {
  block: WorkflowBlock;
  status?: BlockStatus;
  onPress: () => void;
  isLast?: boolean;
}

export const BlockCard: React.FC<Props> = ({ block, status = 'idle', onPress, isLast }) => {
  const meta = BLOCKS[block.type];
  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.card,
          status === 'run' && { borderColor: Colors.accent },
          status === 'ok' && { borderColor: 'rgba(52, 211, 153, 0.5)' },
          status === 'fail' && { borderColor: Colors.error },
        ]}
      >
        <View style={styles.iconWrap}>
          <Image source={meta.icon} style={styles.icon} resizeMode="contain" />
        </View>
        <View style={styles.text}>
          <Text style={styles.type}>{meta.label}</Text>
          <Text style={styles.title}>{meta.title}</Text>
          <Text style={styles.desc} numberOfLines={2}>{describeBlock(block)}</Text>
        </View>
        <View style={styles.status}>
          {status === 'run' && <ActivityIndicator size="small" color={Colors.accent} />}
          {status === 'ok' && <Text style={[styles.mark, { color: Colors.success }]}>✓</Text>}
          {status === 'fail' && <Text style={[styles.mark, { color: Colors.error }]}>✕</Text>}
          {status === 'idle' && <Text style={[styles.mark, { color: Colors.textSecondary }]}>›</Text>}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.connector} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 20, height: 20 },
  text: { flex: 1 },
  type: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  title: { color: Colors.textPrimary, fontSize: 13.5, fontWeight: '500', marginTop: 1 },
  desc: { color: Colors.textSecondary, fontSize: 11.5, marginTop: 2 },
  status: { width: 20, alignItems: 'center' },
  mark: { fontSize: 17, fontWeight: '500' },
  connector: { width: 1, height: 14, backgroundColor: Colors.border, marginLeft: 29 },
});
