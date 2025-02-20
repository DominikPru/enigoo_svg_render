import { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ResizeContext, ResizeContextType } from '../provider/ResizeProvider';
import { renderTypes } from '../../src/types';

const CategoriesHeader = () => {
  const { setSelectedCategoryId, selectedCategoryId, renderType, sourceData } = useContext(ResizeContext) as ResizeContextType;

  const aggregateCategories = () => {
    const categoryMap = new Map<number, {
      id: number;
      price: number;
      color: string;
      totalCount?: number;
    }>();

    sourceData.sectors.forEach(sector => {
      sector.categories.forEach(category => {
        if (category.price === 0) {
          return;
        }

        const existing = categoryMap.get(category.id);
        if (existing) {
          existing.totalCount = (existing.totalCount || 0) + (typeof category.count === 'number' ? category.count : 0);
        } else {
          categoryMap.set(category.id, {
            id: category.id,
            price: category.price,
            color: category.color,
            totalCount: typeof category.count === 'number' ? category.count : 0,
          });
        }
      });
    });

    return Array.from(categoryMap.values());
  };

  const handleCategoryPress = (categoryId: number) => {
    const newSelectedId = selectedCategoryId === categoryId ? null : categoryId;
    setSelectedCategoryId(newSelectedId);
  };

  // Fixed the categories access
  const uniqueCategories = renderType === renderTypes.SECTOR ? 
    aggregateCategories() : 
    (sourceData.categories || []);

  return (
    <View style={styles.headerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {uniqueCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handleCategoryPress(category.id)}
          >
            <View style={[
              styles.categoryContainer,
              selectedCategoryId === category.id && styles.selectedCategory
            ]}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: category.color }
                ]}
              />
              <Text style={styles.priceText}>
                {category.price} Kč
                {category.totalCount !== undefined && (
                  <Text style={styles.seatCount}>
                    {category.totalCount !== 0 && ` (${category.totalCount} míst)`}
                  </Text>
                )}
              </Text>
              {selectedCategoryId === category.id && (
                <Text style={styles.closeButton}>×</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8f4fc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingTop: 16,
    zIndex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedCategory: {
    backgroundColor: '#e8e4ec',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  seatCount: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
  },
  closeButton: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666666',
  },
});

export default CategoriesHeader;