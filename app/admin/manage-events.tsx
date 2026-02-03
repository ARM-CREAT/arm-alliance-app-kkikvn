
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { adminGet, adminPost, adminPut, adminDelete } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export default function ManageEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    imageUrl: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const checkAdminAuth = useCallback(async () => {
    console.log('[ManageEvents] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[ManageEvents] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[ManageEvents] No admin credentials, redirecting to login');
        router.replace('/admin/login');
        return false;
      }
    } catch (error) {
      console.error('[ManageEvents] Error checking admin auth:', error);
      router.replace('/admin/login');
      return false;
    }
  }, [router]);

  const loadEvents = useCallback(async () => {
    console.log('[ManageEvents] Loading events');
    try {
      const response = await adminGet<Event[]>('/api/events');
      setEvents(response || []);
      console.log('[ManageEvents] Loaded', response?.length || 0, 'events');
    } catch (error) {
      console.error('[ManageEvents] Error loading events:', error);
      showModal('Erreur', 'Impossible de charger les événements', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initScreen = async () => {
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        loadEvents();
      }
    };
    
    initScreen();
  }, [checkAdminAuth, loadEvents]);

  const onRefresh = useCallback(() => {
    console.log('[ManageEvents] Refreshing events');
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const handleCreate = () => {
    console.log('[ManageEvents] Creating new event');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditing(true);
    setCurrentEvent(null);
    setFormData({ title: '', description: '', date: '', location: '', imageUrl: '' });
  };

  const handleEdit = (event: Event) => {
    console.log('[ManageEvents] Editing event:', event.id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(true);
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      imageUrl: event.imageUrl || '',
    });
  };

  const handleSave = async () => {
    console.log('[ManageEvents] Saving event');
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.date.trim() || !formData.location.trim()) {
      showModal('Erreur', 'Tous les champs obligatoires doivent être remplis', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      if (currentEvent) {
        await adminPut(`/api/admin/events/${currentEvent.id}`, {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          location: formData.location,
          imageUrl: formData.imageUrl || undefined,
        });
      } else {
        await adminPost('/api/admin/events', {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          location: formData.location,
          imageUrl: formData.imageUrl || undefined,
        });
      }

      showModal('Succès', 'Événement enregistré avec succès', 'success');
      setEditing(false);
      loadEvents();
    } catch (error: any) {
      console.error('[ManageEvents] Error saving event:', error);
      showModal('Erreur', error?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event: Event) => {
    console.log('[ManageEvents] Deleting event:', event.id);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setLoading(true);

    try {
      await adminDelete(`/api/admin/events/${event.id}`);
      showModal('Succès', 'Événement supprimé avec succès', 'success');
      loadEvents();
    } catch (error: any) {
      console.error('[ManageEvents] Error deleting event:', error);
      showModal('Erreur', error?.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('[ManageEvents] Canceling edit');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(false);
    setCurrentEvent(null);
    setFormData({ title: '', description: '', date: '', location: '', imageUrl: '' });
  };

  if (!isAuthenticated || (loading && !refreshing && !editing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: currentEvent ? 'Modifier l\'Événement' : 'Nouvel Événement',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de l'événement"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description de l'événement"
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS"
                placeholderTextColor={colors.textSecondary}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lieu *</Text>
              <TextInput
                style={styles.input}
                placeholder="Lieu de l'événement"
                placeholderTextColor={colors.textSecondary}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL de l&apos;image (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          onClose={() => setModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gérer les Événements',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.background}
            />
            <Text style={styles.createButtonText}>Nouvel Événement</Text>
          </TouchableOpacity>
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>Aucun événement</Text>
            <Text style={styles.emptyStateSubtext}>Créez votre premier événement</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => {
              const eventDate = new Date(event.date).toLocaleDateString('fr-FR');
              return (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventItemHeader}>
                    <Text style={styles.eventItemTitle}>{event.title}</Text>
                    <Text style={styles.eventItemDate}>{eventDate}</Text>
                  </View>
                  <Text style={styles.eventItemLocation}>{event.location}</Text>
                  <Text style={styles.eventItemDescription} numberOfLines={3}>
                    {event.description}
                  </Text>
                  <View style={styles.eventItemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(event)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="pencil"
                        android_material_icon_name="edit"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(event)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={18}
                        color={colors.error}
                      />
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 8,
  },
  eventsList: {
    paddingHorizontal: 20,
  },
  eventItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventItemHeader: {
    marginBottom: 8,
  },
  eventItemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  eventItemDate: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  eventItemLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  eventItemDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  eventItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
});
