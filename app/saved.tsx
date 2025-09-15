// app/saved.tsx
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteSavedPlace, getSavedPlaces } from '../services/storageService';

export default function SavedScreen() {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSavedPlaces = async () => {
    try {
      const places = await getSavedPlaces();
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedPlaces();
    }, [])
  );

  const handleDelete = (id: string, name:string) => {
    Alert.alert(
      'Delete Saved Place',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedPlace(id);
              await loadSavedPlaces();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete saved place');
            }
          },
        },
      ]
    );
  };

  const renderSavedPlace = ({ item } :{item:any} ) => (
    <TouchableOpacity
      style={styles.savedItem}
      onPress={() => {
        router.push({
          pathname: '/result',
          params: { 
            imageUri: item.imageUri,
            savedData: JSON.stringify(item),
            fromSaved: 'true'
          }
        });
      }}
    >
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemLocation} numberOfLines={1}>
          {item.userLocation || item.location}
        </Text>
        <Text style={styles.itemDate}>
          Saved {new Date(item.savedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading saved places...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Clean Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Saved Landmarks</Text>
              <Text style={styles.headerSubtitle}>{savedPlaces.length} places saved</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </View>

      {savedPlaces.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏛️</Text>
          <Text style={styles.emptyTitle}>No saved places yet</Text>
          <Text style={styles.emptySubtitle}>
            Take photos of landmarks places and save them for later!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.exploreButtonText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          renderItem={renderSavedPlace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Clean Header Styles
  headerContainer: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
    fontWeight: '500',
  },
  headerRight: {
    width: 40,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: 16,
  },
  exploreButton: {
    backgroundColor: '#13a4ec',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemLocation: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  deleteButtonText: {
    fontSize: 20,
  },
});