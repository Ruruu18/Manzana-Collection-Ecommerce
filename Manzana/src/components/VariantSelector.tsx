import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProductVariant } from '../types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
  type: 'color' | 'size' | 'style';
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  onSelectVariant,
  type,
}) => {
  // Filter variants by type and only show active ones
  const filteredVariants = variants.filter(
    (v) => v.type === type && v.is_active
  );

  if (filteredVariants.length === 0) {
    return null;
  }

  const getVariantLabel = () => {
    switch (type) {
      case 'color':
        return 'Color';
      case 'size':
        return 'Size';
      case 'style':
        return 'Style';
      default:
        return 'Option';
    }
  };

  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      red: '#EF4444',
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#F59E0B',
      black: '#000000',
      white: '#FFFFFF',
      gray: '#6B7280',
      grey: '#6B7280',
      pink: '#EC4899',
      purple: '#8B5CF6',
      orange: '#F97316',
      brown: '#92400E',
      beige: '#D4A574',
      navy: '#1E3A8A',
      teal: '#14B8A6',
    };

    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || '#6B7280';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getVariantLabel()}</Text>
      <View style={styles.optionsContainer}>
        {filteredVariants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isOutOfStock = variant.stock_quantity === 0;

          if (type === 'color') {
            return (
              <TouchableOpacity
                key={variant.id}
                onPress={() => !isOutOfStock && onSelectVariant(variant)}
                disabled={isOutOfStock}
                style={[
                  styles.colorOption,
                  isSelected && styles.selectedColorOption,
                  isOutOfStock && styles.outOfStockOption,
                ]}
              >
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: getColorCode(variant.value) },
                    variant.value.toLowerCase() === 'white' && styles.whiteColorBorder,
                    isOutOfStock && styles.outOfStockColor,
                  ]}
                />
                <Text
                  style={[
                    styles.colorText,
                    isOutOfStock && styles.outOfStockText,
                  ]}
                >
                  {variant.value}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={variant.id}
              onPress={() => !isOutOfStock && onSelectVariant(variant)}
              disabled={isOutOfStock}
              style={[
                styles.option,
                isSelected && styles.selectedOption,
                isOutOfStock && styles.outOfStockOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                  isOutOfStock && styles.outOfStockText,
                ]}
              >
                {variant.value}
              </Text>
              {isOutOfStock && (
                <Text style={styles.outOfStockLabel}>Out of Stock</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedVariant && selectedVariant.price_adjustment !== 0 && (
        <Text style={styles.priceAdjustment}>
          {selectedVariant.price_adjustment > 0 ? '+' : ''}
          ₱{selectedVariant.price_adjustment.toFixed(2)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8F0',
  },
  optionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#8B4513',
    fontWeight: '600',
  },
  colorOption: {
    alignItems: 'center',
    marginRight: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8F0',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  whiteColorBorder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  colorText: {
    fontSize: 12,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  outOfStockOption: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  outOfStockColor: {
    opacity: 0.3,
  },
  outOfStockText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  outOfStockLabel: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
  },
  priceAdjustment: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    marginTop: 6,
  },
});
