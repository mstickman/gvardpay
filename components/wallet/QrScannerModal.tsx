import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../constants/colors';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = React.useState(false);

  React.useEffect(() => {
    if (visible) setHandled(false);
  }, [visible]);

  const handleScan = (result: { data: string }) => {
    if (handled) return;
    setHandled(true);
    onScanned(result.data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <Text style={styles.hint}>Проверяю доступ к камере...</Text>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.hint}>Нужен доступ к камере для сканирования QR</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Разрешить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
          />
        )}

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Закрыть">
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Сканировать адрес</Text>
          <View style={{ width: 30 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  hint: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  permBtn: { marginTop: 16, backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  permBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 18, paddingBottom: 14,
  },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: 15, color: Colors.textPrimary },
  title: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
});
