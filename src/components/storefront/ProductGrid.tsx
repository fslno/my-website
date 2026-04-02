'use client';

import React, { useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, limit as firestoreLimit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePath } from '@/lib/paths';
import { useLoading } from '@/context/LoadingContext';
import { LoadingCover } from '@/components/ui/LoadingCover';

import { cn } from '@/lib/utils';

interface ProductGridProps {
  initialProducts?: any[];
  categoryId?: string;
  itemsPerPage?: number;
  limit?: number;
  excludeId?: string;
  className?: string;
  gridClassName?: string;
  showTitle?: boolean;
  title?: string;
}

/**
 * This shows a grid of products.
 * It is set up to load products smoothly and avoid errors when the page starts.
 */
export function ProductGrid({
  initialProducts,
  categoryId,
  itemsPerPage = 60,
  limit,
  excludeId,
  className,
  gridClassName,
  showTitle,
  title
}: ProductGridProps) {
  const db = useFirestore();

  // 01. State for Pagination
  const [hasMounted, setHasMounted] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>(initialProducts || []);
  const [lastDoc, setLastDoc] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(!initialProducts?.length);
  const [loadedCount, setLoadedCount] = React.useState(0);
  const { pushLoading, popLoading } = useLoading();
  const lockId = React.useMemo(() => `grid-${categoryId || 'all'}-${Math.random().toString(36).substring(7)}`, [categoryId]);
  const INITIAL_BATCH = 20;

  // Hydration Stability: Force a consistent initial render
  useEffect(() => {
    setHasMounted(true);
    pushLoading(lockId);
    
    // Safety timeout to prevent the splash screen from hanging if images fail
    const safetyTimer = setTimeout(() => popLoading(lockId), 5000);
    return () => {
      clearTimeout(safetyTimer);
      popLoading(lockId);
    };
  }, [pushLoading, popLoading, lockId]);

  // Initial Fetch & Category Filtering
  useEffect(() => {
    async function fetchInitial() {
      if (!db || initialProducts?.length) return;
      
      setIsLoadingMore(true);
      try {
        let q = query(
          collection(db, getLivePath('products')), 
          orderBy('createdAt', 'desc'), 
          firestoreLimit(INITIAL_BATCH)
        );
        
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        setProducts(fetched);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === INITIAL_BATCH);
      } catch (err) {
        console.error("Failed to fetch initial products", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
    fetchInitial();
  }, [db, categoryId]);

  const loadMore = async () => {
    if (!db || !lastDoc || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      let q = query(
        collection(db, getLivePath('products')), 
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        firestoreLimit(INITIAL_BATCH)
      );
      
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      setProducts(prev => [...prev, ...fetched]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === INITIAL_BATCH);
    } catch (err) {
      console.error("Failed to load more products", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 02. Get extra info like categories and reviews
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, getLivePath('categories'));
  }, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/reviews')) : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'reviews');
  }, [db]);
  const { data: allReviews } = useCollection(reviewsQuery);

  const productRatings = useMemo(() => {
    const map: Record<string, { sum: number, count: number }> = {};
    if (!allReviews) return map;
    
    allReviews.forEach(r => {
      if (!r.published) return;
      if (!map[r.productId]) map[r.productId] = { sum: 0, count: 0 };
      map[r.productId].sum += (r.rating || 0);
      map[r.productId].count += 1;
    });
    return map;
  }, [allReviews]);

  // Combined loading state with hydration guard
  // If we have initial products, we don't show the skeleton during hydration
  const isInitialLoading = !hasMounted 
    ? !initialProducts?.length 
    : !products.length && isLoadingMore;

  const filteredProducts = useMemo(() => {
    let p = products || [];
    if (excludeId) p = p.filter((item: any) => item.id !== excludeId);
    if (limit) p = p.slice(0, limit);
    return p;
  }, [products, excludeId, limit]);

  // Handle image load tracking to release the lock
  const handleImageLoad = React.useCallback(() => {
    setLoadedCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Release the splash screen only when data is fetched AND the first row (up to 4 images) is visible
    const targetImages = Math.min(filteredProducts.length, 4);
    if (!isInitialLoading && (loadedCount >= targetImages || filteredProducts.length === 0)) {
      popLoading(lockId);
    }
  }, [loadedCount, filteredProducts.length, isInitialLoading, popLoading, lockId]);

  // Fixed layout classes for the grid: 2 columns on mobile, exactly 4 on desktop
  const gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-4 md:gap-y-12 max-w-[1095.6px] mx-auto";

  const reviewsEnabled = reviewConfig?.enabled !== false;

  useEffect(() => {
    if (!isInitialLoading && products?.length) {
      if (typeof window !== 'undefined') {
        const lastId = sessionStorage.getItem('fslno_last_product_id');
        const isReturning = sessionStorage.getItem('fslno_returning_to_product') === 'true';
        
        if (lastId && isReturning) {
          // Perform instant scroll while covered by white overlay
          setTimeout(() => {
            const el = document.getElementById(`product-${lastId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 150;
              window.scrollTo({ top: y, behavior: 'instant' });
              // Clear product ID but keep returning flag for the overlay to finish its fade
              sessionStorage.removeItem('fslno_last_product_id');
            }
          }, 50); // Faster trigger
        }
      }
    }
  }, [isInitialLoading, products]);

  if (isInitialLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24">
        <div className={gridClasses}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 py-1">
              <div className="w-full aspect-square rounded-sm bg-gray-50 relative overflow-hidden border border-gray-100">
                <LoadingCover logoSize={60} />
              </div>
              <div className="flex flex-col py-1 gap-1">
                {/* Price Skeleton */}
                <div className="h-5 sm:h-6 flex items-center">
                  <Skeleton className="h-3 w-16 bg-gray-100 rounded-none" />
                </div>
                {/* Title Skeleton */}
                <div className="h-[2.4rem] sm:h-[2.8rem] flex flex-col justify-start mt-0.5">
                  <Skeleton className="h-3 w-full bg-gray-50 rounded-none mt-1" />
                  <Skeleton className="h-3 w-2/3 bg-gray-50 rounded-none mt-1.5" />
                </div>
                {/* Brand/SKU Skeleton */}
                <div className="h-4 flex items-center mt-0.5">
                  <Skeleton className="h-2 w-24 bg-gray-100 rounded-none" />
                </div>
                {/* Stock Skeleton */}
                <div className="h-4 flex items-center mt-1">
                  <Skeleton className="h-2 w-12 bg-gray-50 rounded-none" />
                </div>
                {/* Reviews Skeleton */}
                <div className="h-4 flex items-center mt-1">
                  <Skeleton className="h-2 w-20 bg-gray-50 rounded-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-12">
      <div className={gridClasses}>
        {filteredProducts.map((product: any, idx: number) => {
          const productCategory = categories?.find(c => c.id === product.categoryId)?.name || 'Archive';
          const ratingInfo = productRatings[product.id];
          const avgRating = reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0;
          const reviewCount = reviewsEnabled && ratingInfo ? ratingInfo.count : 0;
          
          // Check how many items are in stock
          const variants = product.variants || [];
          const totalStock = variants.length > 0 
            ? variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
            : Number(product.inventory) || 0;
            
          const isSoldOut = totalStock <= 0;

          return (
            <ProductCard 
              key={product.id} 
              id={product.id}
              name={product.name}
              price={`C$${(Number(product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              comparedPrice={product.comparedPrice}
              image={product.media?.[0]?.url || ''}
              hoverImage={product.media?.[1]?.url}
              category={productCategory}
              sku={product.sku}
              rating={avgRating}
              reviewCount={reviewCount}
              isSoldOut={isSoldOut}
              inventory={totalStock}
              priority={idx < 4}
              onImageLoad={handleImageLoad}
            />
          );
        })}
      </div>

      {/* Infinite Scroll Load More */}
      {hasMore && !limit && (
        <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col items-center gap-6">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="text-[10px] font-bold uppercase tracking-[0.3em] disabled:opacity-20 transition-all hover:tracking-[0.4em] active:scale-95 bg-black text-white px-10 py-5 rounded-none shadow-xl hover:shadow-2xl flex items-center gap-4"
          >
            {isLoadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                LOADING...
              </>
            ) : (
              'LOAD MORE PRODUCTS'
            )}
          </button>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
            Showing {products.length} Products
          </p>
        </div>
      )}
    </div>
  );
}
