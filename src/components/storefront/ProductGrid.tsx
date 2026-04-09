'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, limit as firestoreLimit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, getCountFromServer } from 'firebase/firestore';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePath } from '@/lib/paths';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  itemsPerPage = 20,
  limit,
  excludeId,
  className,
  gridClassName,
  showTitle,
  title
}: ProductGridProps) {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const gridRef = React.useRef<HTMLDivElement>(null);

  // 00. Fetch configs
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig } = useDoc(storeRef);

  // 01. State for Pagination
  const [hasMounted, setHasMounted] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>(initialProducts || []);
  const [allCursors, setAllCursors] = React.useState<any[]>([]);
  const urlPage = Number(searchParams.get('page')) || 1;
  const [currentPage, setCurrentPage] = React.useState(urlPage);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(!initialProducts?.length);

  const [effectiveItemsPerPage, setEffectiveItemsPerPage] = useState(limit || itemsPerPage || 24);
  const [isTabletSize, setIsTabletSize] = useState(false);

  // 02. Handle Responsive Batching
  useEffect(() => {
    // Only apply responsive logic if itemsPerPage was not explicitly customized to something other than 24
    const checkViewport = () => {
      const width = window.innerWidth;
      const isTablet = width >= 768 && width <= 1023;
      setIsTabletSize(isTablet);
      
      if (!limit && (itemsPerPage === 24 || itemsPerPage === 20)) {
        setEffectiveItemsPerPage(isTablet ? 21 : 24);
      }
    };
    
    checkViewport();
    // We don't necessarily want to change the limit WHILE browsing if they resize, 
    // as it might mess up Firestore pagination cursors. setting it on mount is safest.
  }, [limit, itemsPerPage]);

  const ITEMS_PER_PAGE = effectiveItemsPerPage;

  // Track if we've already synced the initial SSR products
  const didInitialSync = React.useRef(false);
  const lastCategoryId = React.useRef(categoryId);

  // Hydration Stability
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Handle Category Change
  useEffect(() => {
    if (categoryId !== lastCategoryId.current) {
      setProducts([]);
      setAllCursors([]);
      setCurrentPage(1);
      setTotalCount(0);
      setIsInitialLoading(true);
      lastCategoryId.current = categoryId;
      didInitialSync.current = false;
    }
  }, [categoryId]);

  const fetchPage = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    if (pageNumber === 1) params.delete('page');
    else params.set('page', pageNumber.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const loadDataForPage = async (pageNumber: number, forceInitialLoading = false) => {
    if (!db || !hasMounted) return;
    setIsLoading(true);
    if (forceInitialLoading) setIsInitialLoading(true);

    try {
      const productsPath = getLivePath('products');
      let baseQ = query(collection(db, productsPath), orderBy('createdAt', 'desc'));
      if (categoryId && categoryId !== 'all') {
        baseQ = query(baseQ, where('categoryId', '==', categoryId));
      }

      // 1. If we don't have all cursors yet, fetch them (only once per category)
      let currentCursors = allCursors;
      if (allCursors.length === 0) {
        // Optimized: Only get entire collection if we really need all cursors for numbered pagination
        // If the collection is huge, this is expensive. 
        const fullSnapshot = await getDocs(baseQ);
        currentCursors = fullSnapshot.docs;
        setAllCursors(currentCursors);
        setTotalCount(fullSnapshot.size);
      }

      // 1.5 If we are on page 1 and already have products (SSR), and we just fetched metadata, 
      // we can theoretically skip the product fetch. But to ensure hydration matches and fits
      // the Firestore cursors exactly, we'll proceed if it's the very first metadata fetch.
      // If products already exist and we just got cursors, we have what we need for the footer.

      // 2. Determine pagination range
      const willInjectGiftCard = pageNumber === 1 && !limit && theme?.giftCardsEnabled !== false;
      const baseLimit = (limit && excludeId) ? limit + 1 : ITEMS_PER_PAGE;
      const limitToFetch = willInjectGiftCard ? baseLimit - 1 : baseLimit;

      // 3. Construct the page query
      let q = query(baseQ, firestoreLimit(limitToFetch));
      if (pageNumber > 1) {
        const cursorIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
        const prevPageLastDoc = currentCursors[cursorIndex - 1];
        if (prevPageLastDoc) {
          q = query(baseQ, startAfter(prevPageLastDoc), firestoreLimit(limitToFetch));
        }
      }

      const snapshot = await getDocs(q);
      let fetchedData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      if (willInjectGiftCard) {
        const GIFT_CARD_ID = 'digital-gift-card';
        if (!fetchedData.find(p => p.id === GIFT_CARD_ID)) {
          const giftCardProduct = {
            id: GIFT_CARD_ID,
            name: 'Digital Gift Card',
            price: '25.00',
            image: '/images/digital-gift-card-feiselino-gold.png',
            category: 'Gift Cards',
            categoryId: 'gift-cards',
            isSoldOut: false,
            inventory: 999,
            isDigital: true,
            priority: true
          };
          if (fetchedData.length >= 7) fetchedData.splice(7, 0, giftCardProduct);
          else fetchedData.push(giftCardProduct);
        }
      }

      setProducts(fetchedData);
      setCurrentPage(pageNumber);
      
      // Scroll to top of grid
      if (!forceInitialLoading && gridRef.current) {
        window.scrollTo({ 
          top: gridRef.current.offsetTop - 120, // Adjust for sticky header
          behavior: 'smooth' 
        });
      }

    } catch (err) {
      console.error("Failed to fetch products page", err);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  // Initial Sync / Fetch data based on URL
  useEffect(() => {
    if (!hasMounted || !db) return;

    // Trigger load when page param changes or on initial mount
    const targetPage = Number(searchParams.get('page')) || 1;
    
    // Fix: Trigger load even if we have products but totalCount is 0 (SSR initial state)
    // This ensures totalCount and allCursors are fetched so pagination numbers appear.
    if ((targetPage !== currentPage || products.length === 0 || totalCount === 0) && !isLoading) {
      loadDataForPage(targetPage, products.length === 0 && totalCount === 0);
    }
  }, [db, hasMounted, searchParams, categoryId, totalCount, isLoading]);

  // Extra info
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, getLivePath('categories')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/reviews')) : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  const reviewsQuery = useMemoFirebase(() => db ? collection(db, 'reviews') : null, [db]);
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

  const filteredProducts = useMemo(() => {
    let p = products || [];
    if (excludeId) p = p.filter((item: any) => item.id !== excludeId);
    if (limit) p = p.slice(0, limit);
    return p;
  }, [products, excludeId, limit]);

  const reviewsEnabled = reviewConfig?.enabled !== false;

  // Grid Layout Logic
  const gridClasses = cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 sm:gap-x-2 md:gap-x-4 gap-y-4 md:gap-y-12 w-full max-w-[1440px] mx-auto",
    gridClassName
  );

  const renderFooter = () => {
    if (totalCount === 0 && !isInitialLoading) return null;

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
      }

      // Always show first
      pages.push(1);

      if (currentPage <= 4) {
        // Near beginning: 1 2 3 4 5 ... 10
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... 6 7 8 9 10
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          if (!pages.includes(i)) pages.push(i);
        }
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
      
      return pages;
    };

    return (
      <div className="mt-20 flex flex-col items-center gap-10">
        {/* Numbered Pagination */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => fetchPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            {getPageNumbers().map((num, idx) => (
              num === '...' ? (
                <span key={`dots-${idx}`} className="w-8 h-10 flex items-center justify-center text-black/40 text-[10px] font-black tracking-widest">
                  ...
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => fetchPage(num as number)}
                  disabled={isLoading}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center text-[10px] font-black tracking-widest transition-all",
                    currentPage === num 
                      ? "bg-black text-white" 
                      : "hover:bg-gray-100 text-black border border-transparent hover:border-gray-200"
                  )}
                  style={{ borderRadius: 'var(--btn-radius)' }}
                >
                  {num}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => fetchPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Info */}
        <div className="text-center space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/40">
            Page {currentPage} of {totalPages} — Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} Products
          </p>
          <div className="w-48 h-[1px] bg-gray-100 mx-auto relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-black transition-all duration-700 ease-out"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (isInitialLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24 min-h-[100vh]">
        <div className={gridClasses}>
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <Skeleton className="w-full aspect-square bg-gray-100 rounded-none" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-2/3 bg-gray-100" />
                <Skeleton className="h-3 w-1/2 bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton Footer to prevent layout shift */}
        <div className="mt-20 flex flex-col items-center gap-6 animate-pulse">
           <Skeleton className="h-14 w-64 bg-gray-50" style={{ borderRadius: 'var(--btn-radius)' }} />
           <div className="space-y-2 flex flex-col items-center">
             <Skeleton className="h-2 w-32 bg-gray-50" />
             <Skeleton className="h-1 w-48 bg-gray-50" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={gridRef} className={cn("max-w-[1440px] mx-auto px-4 pt-0 pb-12", className)}>
      {showTitle && title && (
        <h2 className="text-xl font-black uppercase tracking-[0.3em] mb-12 text-center">{title}</h2>
      )}

      <div className={gridClasses}>
        {filteredProducts.map((product: any, idx: number) => {
          const productCategory = categories?.find(c => c.id === product.categoryId)?.name || 'Archive';
          const ratingInfo = productRatings[product.id];
          const avgRating = reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0;
          const reviewCount = reviewsEnabled && ratingInfo ? ratingInfo.count : 0;

          const variants = product.variants || [];
          const totalStock = variants.length > 0
            ? variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
            : Number(product.inventory) || 0;
          const isSoldOut = totalStock <= 0;

          return (
            <ProductCard
              key={`${product.id}-${idx}`}
              id={product.id}
              name={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? 'Digital Gift Card' : product.name}
              price={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? "C$25.00" : `C$${(Number(product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              comparedPrice={product.comparedPrice}
              image={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? '/images/digital-gift-card-feiselino-gold.png' : (product.media?.[0]?.url || '')}
              images={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? ['/images/digital-gift-card-feiselino-gold.png'] : (product.media?.map((m: any) => m.url).filter(Boolean) || [])}
              category={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? 'DIGITAL' : productCategory}
              sku={product.sku}
              rating={avgRating}
              reviewCount={reviewCount}
              isSoldOut={isSoldOut}
              inventory={totalStock}
              href={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(product.id) ? '/gift-cards' : undefined}
              priority={idx < 8}
              preorderEnabled={product.preorderEnabled}
              theme={theme}
              storeConfig={storeConfig}
            />
          );
        })}
      </div>

      {/* Collection Footer */}
      {renderFooter()}
    </div>
  );
}
