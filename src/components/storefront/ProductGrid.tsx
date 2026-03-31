'use client';

import React, { useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePath } from '@/lib/deployment';

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

  // 01. Get products from the database
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, getLivePath('products')), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: rawProducts, isLoading: productsLoading } = useCollection(productsQuery);

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

  const [currentPage, setCurrentPage] = React.useState(1);

  const products = useMemo(() => {
    let p = rawProducts || [];
    if (excludeId) p = p.filter(item => item.id !== excludeId);
    if (limit) p = p.slice(0, limit);
    return p;
  }, [rawProducts, excludeId, limit]);

  const paginatedProducts = useMemo(() => {
    if (!products) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);

  // Fixed layout classes for the grid
  const gridClasses = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-4 md:gap-y-16";

  const reviewsEnabled = reviewConfig?.enabled !== false;

  useEffect(() => {
    if (!productsLoading && products?.length) {
      if (typeof window !== 'undefined') {
        const lastId = sessionStorage.getItem('lastProductId');
        if (lastId) {
          setTimeout(() => {
            const el = document.getElementById(`product-${lastId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 150;
              window.scrollTo({ top: y, behavior: 'instant' });
              sessionStorage.removeItem('lastProductId');
            }
          }, 200);
        } else if (currentPage > 1) {
          // Auto-scroll to top of grid on page change
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }, [productsLoading, products, currentPage]);

  if (productsLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24">
        <div className={gridClasses}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-square rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24">
      <div className={gridClasses}>
        {paginatedProducts.map((product: any, idx: number) => {
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
              priority={idx < 4}
            />
          );
        })}
      </div>

      {/* Simple Pagination */}
      {totalPages > 1 && (
        <div className="mt-24 border-t border-gray-100 pt-12 flex flex-col items-center gap-8">
          <div className="flex items-center gap-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="text-[10px] font-bold uppercase tracking-[0.3em] disabled:opacity-20 transition-all hover:tracking-[0.4em] active:scale-95"
            >
              Previous
            </button>
            <div className="flex items-center gap-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "text-[10px] font-bold transition-all transition-colors",
                    currentPage === page ? "text-black" : "text-gray-300 hover:text-black"
                  )}
                >
                  {page.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="text-[10px] font-bold uppercase tracking-[0.3em] disabled:opacity-20 transition-all hover:tracking-[0.4em] active:scale-95"
            >
              Next
            </button>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
