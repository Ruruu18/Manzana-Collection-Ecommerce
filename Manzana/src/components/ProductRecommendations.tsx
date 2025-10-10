import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recommendationsService } from '../services/recommendations';
import { Product } from '../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import ProductCard from './ProductCard';

const { width: screenWidth } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = 160;

interface ProductRecommendationsProps {
  type: 'similar' | 'frequently-bought' | 'personalized' | 'trending' | 'you-may-like';
  productId?: string;
  userId?: string;
  title?: string;
  onProductPress: (productId: string) => void;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  type,
  productId,
  userId,
  title,
  onProductPress,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [type, productId, userId]);

  const loadRecommendations = async () => {
    setLoading(true);

    let result = { data: null, error: null };

    switch (type) {
      case 'similar':
        if (productId) {
          result = await recommendationsService.getSimilarProducts(productId, 6);
        }
        break;

      case 'frequently-bought':
        if (productId) {
          result = await recommendationsService.getFrequentlyBoughtTogether(productId, 4);
        }
        break;

      case 'personalized':
        if (userId) {
          result = await recommendationsService.getPersonalizedRecommendations(userId, 10);
        }
        break;

      case 'trending':
        result = await recommendationsService.getTrendingProducts(10);
        break;

      case 'you-may-like':
        if (userId && productId) {
          result = await recommendationsService.getYouMayAlsoLike(userId, productId, 6);
        }
        break;
    }

    if (result.data) {
      setProducts(result.data);
    }

    setLoading(false);
  };

  const getTitle = () => {
    if (title) return title;

    switch (type) {
      case 'similar':
        return 'Similar Products';
      case 'frequently-bought':
        return 'Frequently Bought Together';
      case 'personalized':
        return 'Recommended for You';
      case 'trending':
        return 'Trending Now';
      case 'you-may-like':
        return 'You May Also Like';
      default:
        return 'Recommendations';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'similar':
        return 'grid-outline';
      case 'frequently-bought':
        return 'people-outline';
      case 'personalized':
        return 'sparkles-outline';
      case 'trending':
        return 'trending-up-outline';
      case 'you-may-like':
        return 'heart-outline';
      default:
        return 'apps-outline';
    }
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name={getIcon() as any} size={20} color={COLORS.primary} />
          <Text style={styles.title}>{getTitle()}</Text>
        </View>
      </View>

      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            <ProductCard
              product={item}
              onPress={() => onProductPress(item.id)}
              showWishlist={false}
              showStockAlert={false}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
  productContainer: {
    width: PRODUCT_CARD_WIDTH,
  },
});

export default ProductRecommendations;
