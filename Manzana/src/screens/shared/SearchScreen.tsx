import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/theme";

interface SearchScreenProps {
  navigation: any;
  route?: {
    params?: {
      query?: string;
    };
  };
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const initialQuery = route?.params?.query || "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.placeholder}>Search screen</Text>
        {initialQuery && (
          <Text style={styles.queryText}>Initial query: {initialQuery}</Text>
        )}
        <Text style={styles.note}>
          This screen will show a search bar with filters, product results, and
          sorting options.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  placeholder: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  queryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.lg,
    fontWeight: "600",
  },
  note: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default SearchScreen;
