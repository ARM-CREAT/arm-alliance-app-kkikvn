
import { Stack } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  image_url?: string;
}

function resolveImageSource(source: string | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  return { uri: source };
}

export default function AdminEventsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date());
  const [formLocation, setFormLocation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    console.log('[AdminEvents] GET /api/events');
    try {
      const data = await apiGet<EventItem[]>('/api/events');
      const list = Array.isArray(data) ? data : [];
      console.log('[AdminEvents] Events loaded:', list.length);
      setEvents(list);
    } catch (error: any) {
      console.error('[AdminEvents] Error loading events:', error);
      showModalFunc('Erreur', 'Impossible de charger les événements: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('[AdminEvents] Pull-to-refresh triggered');
    setRefreshing(true);
    loadEvents();
  }, []);

  const showModalFunc = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    callback?: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalCallback(callback ? () => callback : null);
    setShowModal(true);
  };

  const handleAdd = () => {
    console.log('[AdminEvents] User tapped Ajouter event');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(new Date());
    setFormLocation('');
    setFormImageUrl('');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowEditModal(true);
  };

  const handleEdit = (item: EventItem) => {
    console.log('[AdminEvents] User tapped Modifier event:', item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEvent(item);
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    const d = new Date(item.date);
    setFormDate(isNaN(d.getTime()) ? new Date() : d);
    setFormLocation(item.location || '');
    setFormImageUrl(item.imageUrl || item.image_url || '');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminEvents] User tapped Annuler form');
    setShowEditModal(false);
    setEditingEvent(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      showModalFunc('Erreur', 'Le titre est obligatoire.', 'warning');
      return;
    }

    console.log('[AdminEvents] User tapped save event, editing:', editingEvent?.id ?? 'new');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    const isoDate = formDate.toISOString();
    console.log('[AdminEvents] Date ISO:', isoDate);

    const eventData: Record<string, string> = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      date: isoDate,
      location: formLocation.trim(),
    };
    if (formImageUrl.trim()) {
      eventData.imageUrl = formImageUrl.trim();
    }
    console.log('[AdminEvents] Submitting event payload:', JSON.stringify(eventData));

    try {
      if (editingEvent) {
        console.log('[AdminEvents] PUT /api/events/' + editingEvent.id);
        await authenticatedPut(`/api/events/${editingEvent.id}`, eventData);
        console.log('[AdminEvents] Event updated successfully');
      } else {
        console.log('[AdminEvents] POST /api/events');
        await authenticatedPost('/api/events', eventData);
        console.log('[AdminEvents] Event created successfully');
      }

      const successMessage = editingEvent ? 'Événement modifié avec succès!' : 'Événement ajouté avec succès!';
      setShowEditModal(false);
      setEditingEvent(null);
      await loadEvents();
      showModalFunc('Succès', successMessage, 'success');
    } catch (error: any) {
      console.error('[AdminEvents] Error submitting event:', error);
      showModalFunc('Erreur', error.message || "Impossible de sauvegarder l'événement.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    console.log('[AdminEvents] User tapped Supprimer event:', id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showModalFunc(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet événement?',
      'confirm',
      async () => {
        console.log('[AdminEvents] DELETE /api/events/' + id);
        try {
          await authenticatedDelete(`/api/events/${id}`);
          console.log('[AdminEvents] Event deleted successfully');
          await loadEvents();
          showModalFunc('Succès', 'Événement supprimé avec succès!', 'success');
        } catch (error: any) {
          console.error('[AdminEvents] Error deleting event:', error);
          showModalFunc('Erreur', error.message || "Impossible de supprimer l'événement.", 'error');
        }
      }
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Gestion des Événements', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  const imageUrl = formImageUrl.trim();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Gestion des Événements', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Événements</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun événement pour le moment</Text>
            </View>
          ) : (
            events.map((event) => {
              const eventImageUrl = event.imageUrl || event.image_url;
              const formattedDate = formatDate(event.date);
              return (
                <View key={event.id} style={styles.eventCard}>
                  {eventImageUrl ? (
                    <Image source={resolveImageSource(eventImageUrl)} style={styles.eventImage} resizeMode="cover" />
                  ) : null}
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription} numberOfLines={3}>{event.description}</Text>
                  <View style={styles.eventMeta}>
                    <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={16} color={colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{formattedDate}</Text>
                  </View>
                  <View style={styles.eventMeta}>
                    <IconSymbol ios_icon_name="location" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                  <View style={styles.eventActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(event)}>
                      <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(event.id)}>
                      <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Confirm / info modal */}
        <Modal
          visible={showModal && modalType !== 'confirm'}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
        <Modal
          visible={showModal && modalType === 'confirm'}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            if (modalCallback) {
              modalCallback();
              setModalCallback(null);
            }
          }}
          title={modalTitle}
          message={modalMessage}
          type="confirm"
          confirmText="Supprimer"
          cancelText="Annuler"
        />

        {/* Edit / Add inline modal */}
        {showEditModal && (
          <View style={styles.editModalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModalWrapper}>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingEvent ? "Modifier l'événement" : 'Nouvel événement'}
                </Text>

                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Titre de l'événement"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Description de l'événement"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.inputLabel}>Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    console.log('[AdminEvents] User tapped date picker button');
                    setShowTimePicker(false);
                    setShowDatePicker(true);
                  }}
                >
                  <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={18} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {formDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.inputLabel}>Heure *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    console.log('[AdminEvents] User tapped time picker button');
                    setShowDatePicker(false);
                    setShowTimePicker(true);
                  }}
                >
                  <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={18} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {formDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(_event, selected) => {
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                      if (selected) {
                        const updated = new Date(formDate);
                        updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                        console.log('[AdminEvents] Date selected:', updated.toISOString());
                        setFormDate(updated);
                      }
                    }}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={formDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_event, selected) => {
                      if (Platform.OS !== 'ios') setShowTimePicker(false);
                      if (selected) {
                        const updated = new Date(formDate);
                        updated.setHours(selected.getHours(), selected.getMinutes());
                        console.log('[AdminEvents] Time selected:', updated.toISOString());
                        setFormDate(updated);
                      }
                    }}
                  />
                )}

                <Text style={styles.inputLabel}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  value={formLocation}
                  onChangeText={setFormLocation}
                  placeholder="Lieu de l'événement"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>URL de l'image (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={formImageUrl}
                  onChangeText={setFormImageUrl}
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {imageUrl.length > 0 && (
                  <Image source={resolveImageSource(imageUrl)} style={styles.imagePreview} resizeMode="cover" />
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel} disabled={submitting}>
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.modalButtonText, styles.submitButtonText]}>
                        {editingEvent ? 'Modifier' : 'Ajouter'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  listContainer: { padding: 16 },
  eventCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  eventImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: 12 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  eventDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  eventMetaText: { fontSize: 13, color: colors.textSecondary },
  eventActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editButton: { backgroundColor: colors.primary + '20' },
  deleteButton: { backgroundColor: '#FF3B3020' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
  editButtonText: { color: colors.primary },
  deleteButtonText: { color: '#FF3B30' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
  editModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  editModalWrapper: { justifyContent: 'flex-end' },
  modalScroll: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' as any, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  imagePreview: { width: '100%', height: 120, borderRadius: 8, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, marginBottom: 32 },
  modalButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.card },
  submitButton: { backgroundColor: colors.primary },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  cancelButtonText: { color: colors.text },
  submitButtonText: { color: '#FFFFFF' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  dateButtonText: { fontSize: 15, color: colors.text, flex: 1 },
});
