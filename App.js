import { useState } from "react"
import {StyleSheet, Text, View, Alert, TouchableOpacity, ScrollView,} from "react-native"
import * as Location from "expo-location"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import { StatusBar } from "expo-status-bar"

export default function App() {
  const [location, setLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [locationHistory, setLocationHistory] = useState([])

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied")
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      setLocation(currentLocation)

      const timestamp = new Date().toISOString()
      const newLocationEntry = {
        ...currentLocation,
        timestamp,
      }

      setLocationHistory((prevHistory) => [...prevHistory, newLocationEntry])

      console.log("Location obtained:", currentLocation)
    } catch (error) {
      console.error("Error getting location:", error)
      setErrorMsg("Could not get location: " + error.message)
    }
  }

  const saveLocationToFile = async () => {
    if (locationHistory.length === 0) {
      Alert.alert("Error", "No location data to save")
      return
    }

    try {
      const permission = await MediaLibrary.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Permission to access media library is required!")
        return
      }

      const locationText = locationHistory
        .map((loc, index) => {
          return (
            `Location #${index + 1} (${loc.timestamp}):\n` +
            `Latitude: ${loc.coords.latitude}\n` +
            `Longitude: ${loc.coords.longitude}\n` +
            `Altitude: ${loc.coords.altitude}\n` +
            `Accuracy: ${loc.coords.accuracy} meters\n` +
            `Speed: ${loc.coords.speed}\n` +
            `Heading: ${loc.coords.heading}\n` +
            `------------------------------\n`
          )
        })
        .join("\n")

      const fileName = `geolocation_${new Date().toISOString().replace(/:/g, "-")}.txt`
      const fileUri = FileSystem.documentDirectory + fileName

      await FileSystem.writeAsStringAsync(fileUri, locationText)

      const asset = await MediaLibrary.createAssetAsync(fileUri)

      const album = await MediaLibrary.getAlbumAsync('Download')
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false)
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
      }

      Alert.alert("Success", "File saved to Downloads folder!")
    } catch (error) {
      console.error("Error saving location data:", error)
      Alert.alert("Error", "Failed to save location data: " + error.message)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={getLocation}>
              <Text style={styles.buttonText}>GET LOCATION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, locationHistory.length === 0 && styles.buttonDisabled]}
              onPress={saveLocationToFile}
              disabled={locationHistory.length === 0}
            >
              <Text style={styles.buttonText}>SAVE LOCATIONS TO FILE</Text>
            </TouchableOpacity>
          </View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>Current Location:</Text>
              <Text>Longitude: {location.coords.longitude}</Text>
              <Text>Latitude: {location.coords.latitude}</Text>
              <Text>Accuracy: {location.coords.accuracy} meters</Text>
            </View>
          )}

          {locationHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.locationText}>Location History ({locationHistory.length}):</Text>
              {locationHistory.map((loc, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text>
                    Location #{index + 1} ({new Date(loc.timestamp).toLocaleTimeString()})
                  </Text>
                  <Text>
                    Lat: {loc.coords.latitude.toFixed(6)}, Long: {loc.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <StatusBar style="auto" />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  section: {
    width: "100%",
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  locationInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f2b7eb",
    borderRadius: 5,
    width: "100%",
  },
  locationText: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  historyContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#c3b7db",
    borderRadius: 5,
    width: "100%",
    maxHeight: 200,
    overflow: "scroll",
  },
  historyItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
  },
})
