'use client';

import React, { useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, limit as firestoreLimit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, getCountFromServer } from 'firebase/firestore';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePath } from '@/lib/paths';

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
  const gridRef = React.useRef<HTMLDivElement>(null);

  // 01. State for Pagination
  const [hasMounted, setHasMounted] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>(initialProducts || []);
  const [lastDoc, setLastDoc] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCursors, setPageCursors] = React.useState<Record<number, QueryDocumentSnapshot<DocumentData> | null>>({ 1: null });
  const [totalCount, setTotalCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(!initialProducts?.length);
  const ITEMS_PER_PAGE = limit || itemsPerPage || 20;

  // Hydration Stability: Force a consistent initial render
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Initial Fetch & Total Count
  useEffect(() => {
    async function fetchInitial() {
      if (!db) return;
      
      // Fetch Total Count
      try {
        let qTotal = query(collection(db, getLivePath('products')));
        if (categoryId && categoryId !== 'all') {
          qTotal = query(qTotal, where('categoryId', '==', categoryId));
        }
        const snapshotTotal = await getCountFromServer(qTotal);
        setTotalCount(snapshotTotal.data().count);
      } catch (err) {
        console.error("Failed to fetch total count", err);
      }

      // Reset pagination state when category changes
      setCurrentPage(1);
      setPageCursors({ 1: null });

      // Sync state if initial products were provided via SSR
      if (initialProducts && initialProducts.length > 0) {
        setProducts(initialProducts);
        // We catch up on the 'lastDoc' marker so pagination can resume
        try {
          const lastProduct = initialProducts[initialProducts.length - 1];
          const docRef = query(collection(db, getLivePath('products')), where('__name__', '==', lastProduct.id));
          const snap = await getDocs(docRef);
          if (!snap.empty) {
            const cursor = snap.docs[0];
            setLastDoc(cursor);
            setPageCursors(prev => ({ ...prev, 2: cursor }));
          }
          setHasMore(initialProducts.length >= ITEMS_PER_PAGE);
        } catch (err) {
          console.error("Failed to sync pagination cursor", err);
        }
        return;
      }

      setIsLoadingMore(true);
      try {
        let q = query(
          collection(db, getLivePath('products')), 
          orderBy('createdAt', 'desc')
        );
        if (categoryId && categoryId !== 'all') {
          q = query(q, where('categoryId', '==', categoryId));
        }
        q = query(q, firestoreLimit(ITEMS_PER_PAGE));
        
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        setProducts(fetched);
        const cursor = snapshot.docs[snapshot.docs.length - 1] || null;
        setLastDoc(cursor);
        if (cursor) setPageCursors(prev => ({ ...prev, 2: cursor }));
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      } catch (err) {
        console.error("Failed to fetch initial products", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
    fetchInitial();
  }, [db, categoryId, initialProducts, ITEMS_PER_PAGE]);

  const goToPage = async (page: number) => {
    if (!db || isLoadingMore || page === currentPage) return;
    
    setIsLoadingMore(true);
    // Scroll to top of grid instead of top of page for better UX
    if (gridRef.current) {
      const offset = 61; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = gridRef.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    try {
      let q = query(
        collection(db, getLivePath('products')), 
        orderBy('createdAt', 'desc')
      );
      if (categoryId && categoryId !== 'all') {
        q = query(q, where('categoryId', '==', categoryId));
      }

      const cursor = pageCursors[page];
      if (cursor) {
        q = query(q, startAfter(cursor), firestoreLimit(ITEMS_PER_PAGE));
      } else {
        // This case shouldn't happen with normal 1,2,3 navigation but just in case
        q = query(q, firestoreLimit(ITEMS_PER_PAGE));
      }
      
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      setProducts(fetched);
      setCurrentPage(page);
      
      const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
      if (nextCursor && !pageCursors[page + 1]) {
        setPageCursors(prev => ({ ...prev, [page + 1]: nextCursor }));
      }
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error("Failed to change page", err);
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





  // Fixed layout classes for the grid: 2 columns on mobile, exactly 4 on desktop
  const gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-4 md:gap-y-12 max-w-[1095.6px] mx-auto";

  const reviewsEnabled = reviewConfig?.enabled !== false;

  // Position restoration removed per user request: always start from top on navigation and pagination

  if (isInitialLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24">
        <div className={gridClasses}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 py-1">
              <div className="w-full aspect-square rounded-sm bg-gray-50 relative overflow-hidden border border-gray-100">
                <Skeleton className="w-full h-full rounded-none" />
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
    <div ref={gridRef} className="max-w-[1440px] mx-auto px-4 pt-0 pb-12">
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
              preorderEnabled={product.preorderEnabled}
            />
          );
        })}
      </div>

      {/* Pagination Controls */}
      {!limit && totalCount > ITEMS_PER_PAGE && (
        <div className="mt-20 border-t border-gray-100 pt-12 flex flex-col items-center gap-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Previous Page */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoadingMore}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-200 hover:border-black disabled:opacity-30 disabled:border-gray-100 transition-all active:scale-95 text-xs font-bold"
            >
              ←
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: Math.ceil(totalCount / ITEMS_PER_PAGE) }).map((_, i) => {
                const page = i + 1;
                // Show 1, current-1, current, current+1, last
                const isFirst = page === 1;
                const isLast = page === Math.ceil(totalCount / ITEMS_PER_PAGE);
                const isNear = Math.abs(page - currentPage) <= 1;

                if (!isFirst && !isLast && !isNear) {
                  // Show ellipsis if there's a gap
                  if (page === 2 || page === Math.ceil(totalCount / ITEMS_PER_PAGE) - 1) {
                    return <span key={page} className="px-2 text-gray-300">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={isLoadingMore}
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xs font-black transition-all active:scale-95",
                      currentPage === page 
                        ? "bg-black text-white" 
                        : "bg-transparent text-gray-400 hover:text-black hover:bg-gray-50"
                    )}
                  >
                    {String(page).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE) || isLoadingMore}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-200 hover:border-black disabled:opacity-30 disabled:border-gray-100 transition-all active:scale-95 text-xs font-bold"
            >
              →
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} – {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} Products
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
