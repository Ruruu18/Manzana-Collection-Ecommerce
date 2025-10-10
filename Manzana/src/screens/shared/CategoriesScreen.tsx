import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { getCategoryIcon } from '../../utils';
import LoadingState from '../../components/LoadingState';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - SPACING.lg * 3) / 2;

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  level: number;
  is_active: boolean;
  subcategories?: Category[];
}

interface CategoriesScreenProps {
  navigation: any;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Fetch all categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('display_order', { ascending: true })
        .order('name');

      if (error) throw error;

      const allCategories = (data || []) as Category[];

      // Organize into hierarchical structure
      const parents = allCategories.filter((cat) => cat.level === 0);
      const children = allCategories.filter((cat) => cat.level === 1);

      // Add subcategories to parents
      const hierarchicalCategories = parents.map((parent) => ({
        ...parent,
        subcategories: children.filter(
          (child) => child.parent_category_id === parent.id
        ),
      }));

      setCategories(hierarchicalCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryProducts', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const renderCategoryCard = ({ item }: { item: Category }) => {
    const isExpanded = expandedCategories.has(item.id);
    const hasSubcategories = item.subcategories && item.subcategories.length > 0;

    return (
      <View style={styles.categorySection}>
        {/* Parent Category Card */}
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => {
            if (hasSubcategories) {
              toggleCategory(item.id);
            } else {
              handleCategoryPress(item);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getCategoryIcon(item.name)}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            {hasSubcategories && (
              <Text style={styles.subcategoryCount}>
                {item.subcategories!.length} collections
              </Text>
            )}
          </View>
          {hasSubcategories && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.textSecondary}
            />
          )}
        </TouchableOpacity>

        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <View style={styles.subcategoriesContainer}>
            {item.subcategories!.map((subcategory) => (
              <TouchableOpacity
                key={subcategory.id}
                style={styles.subcategoryCard}
                onPress={() => handleCategoryPress(subcategory)}
                activeOpacity={0.7}
              >
                <View style={styles.subcategoryIconContainer}>
                  <Text style={styles.subcategoryIcon}>
                    {getCategoryIcon(subcategory.name)}
                  </Text>
                </View>
                <View style={styles.subcategoryInfo}>
                  <Text style={styles.subcategoryName} numberOfLines={1}>
                    {subcategory.name}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <LoadingState loading={true} emptyMessage="">
          {null}
        </LoadingState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Categories</Text>
            <Text style={styles.emptySubtitle}>
              Categories will appear here when they are added
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 30,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  categoryName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  categoryDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  subcategoryCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs / 2,
    fontWeight: '500',
  },
  subcategoriesContainer: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  subcategoryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subcategoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryIcon: {
    fontSize: 20,
  },
  subcategoryInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  subcategoryName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 14,
  },
  subcategoryDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default CategoriesScreen;
